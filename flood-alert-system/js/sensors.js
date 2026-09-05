/**
 * =============================================================
 *  sensors.js - MÓDULO DE SENSORES DE NÍVEL DE ÁGUA
 * =============================================================
 * Este módulo suporta DOIS modos de funcionamento:
 *
 *  1) MODO REAL (hardware físico) - usa a Web Serial API do
 *     navegador Google Chrome (navigator.serial) para ligar
 *     diretamente, por cabo USB, a uma placa Arduino Uno ou
 *     ESP32. A placa deve enviar continuamente, pela porta
 *     série (Serial.println), uma linha de texto em formato
 *     JSON, por exemplo:
 *         {"sensorId":"sen_123","nivel":0.87}
 *     Este ficheiro lê essa linha, converte para número e
 *     atualiza o sensor correspondente na base de dados,
 *     em tempo real, sem qualquer simulação.
 *
 *  2) MODO SIMULAÇÃO - gera valores de nível de água
 *     progressivamente (útil para testes/demonstrações sem
 *     hardware disponível). Quando o nível ultrapassa o
 *     limite de alerta E o navegador está sem ligação à
 *     internet, o sistema emite um sinal sonoro (beep) via
 *     Web Audio API, para alertar localmente o utilizador.
 *
 * A Web Serial API só funciona em contexto seguro (localhost
 * ou HTTPS) e em navegadores baseados em Chromium (Chrome, Edge).
 * =============================================================
 */

const FloodSensors = (() => {

  let portaSerial = null;      // referência à porta série aberta (SerialPort)
  let leitor = null;           // leitor de stream da porta série
  let simulacaoIntervalos = {}; // guarda os setInterval de cada sensor em simulação
  let audioCtx = null;         // contexto de áudio para o beep

  /** Lista todos os sensores cadastrados */
  function listar() {
    return FloodDB._read(FloodDB.TABLES.SENSORS);
  }

  /** Adiciona um novo sensor */
  function adicionar(dados) {
    const sensores = listar();
    const novo = {
      id: FloodDB._uid('sen'),
      nome: dados.nome,
      localizacao: dados.localizacao,
      tipo: dados.tipo || 'Ultrassônico (HC-SR04)',
      dispositivo: dados.dispositivo || 'ESP32',
      latitude: parseFloat(dados.latitude) || -8.6115,
      longitude: parseFloat(dados.longitude) || 13.6905,
      nivelAtual: 0,
      unidade: 'm',
      limiteAlerta: parseFloat(dados.limiteAlerta) || 1.5,
      limiteCritico: parseFloat(dados.limiteCritico) || 2.5,
      status: 'ativo',
      modo: 'simulacao',
      portaSerial: null,
      ultimaLeitura: new Date().toISOString()
    };
    sensores.push(novo);
    FloodDB._write(FloodDB.TABLES.SENSORS, sensores);
    return FloodDB.ok(novo);
  }

  /** Remove um sensor pelo id */
  function remover(id) {
    let sensores = listar();
    sensores = sensores.filter(s => s.id !== id);
    FloodDB._write(FloodDB.TABLES.SENSORS, sensores);
    pararSimulacao(id);
    return FloodDB.ok(true);
  }

  /** Atualiza o nível de água de um sensor e regista a leitura no histórico */
  function _atualizarNivel(sensorId, nivel, origem) {
    const sensores = listar();
    const idx = sensores.findIndex(s => s.id === sensorId);
    if (idx === -1) return;

    sensores[idx].nivelAtual = nivel;
    sensores[idx].ultimaLeitura = new Date().toISOString();
    FloodDB._write(FloodDB.TABLES.SENSORS, sensores);

    const leituras = FloodDB._read(FloodDB.TABLES.LEITURAS);
    leituras.push({
      id: FloodDB._uid('lt'),
      sensorId,
      nivel,
      origem, // 'real' ou 'simulacao'
      data: new Date().toISOString()
    });
    // mantém apenas as últimas 500 leituras para não sobrecarregar o armazenamento
    if (leituras.length > 500) leituras.splice(0, leituras.length - 500);
    FloodDB._write(FloodDB.TABLES.LEITURAS, leituras);

    _verificarAlerta(sensores[idx]);

    // notifica a interface (se existir um ouvinte) de que há novos dados
    document.dispatchEvent(new CustomEvent('flood:leitura-atualizada', { detail: sensores[idx] }));
  }

  /**
   * Verifica se o nível ultrapassou o limiar de alerta e, caso o
   * dispositivo esteja OFFLINE (sem internet), emite um beep sonoro
   * local, garantindo que a comunidade seja avisada mesmo sem rede.
   */
  function _verificarAlerta(sensor) {
    if (sensor.nivelAtual >= sensor.limiteAlerta && !navigator.onLine) {
      emitirBeep();
    }
  }

  /** Emite um sinal sonoro (beep) usando a Web Audio API, sem necessidade de ficheiros de som */
  function emitirBeep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscilador = audioCtx.createOscillator();
      const ganho = audioCtx.createGain();
      oscilador.type = 'square';
      oscilador.frequency.value = 880; // tom de alerta (Lá agudo)
      ganho.gain.value = 0.15;
      oscilador.connect(ganho);
      ganho.connect(audioCtx.destination);
      oscilador.start();
      setTimeout(() => oscilador.stop(), 400); // beep curto de 400ms
    } catch (e) {
      console.warn('Não foi possível emitir o beep de alerta:', e);
    }
  }

  // =====================================================
  //  MODO REAL - Web Serial API (Arduino Uno / ESP32)
  // =====================================================

  /** Indica se o navegador suporta a Web Serial API (necessária para o modo real) */
  function suportaSerial() {
    return 'serial' in navigator;
  }

  /**
   * Solicita ao utilizador que escolha a porta USB do Arduino/ESP32
   * e inicia a leitura contínua e real dos dados enviados pela placa.
   */
  async function conectarDispositivoReal(sensorId) {
    if (!suportaSerial()) {
      return FloodDB.fail('O seu navegador não suporta a Web Serial API. Utilize o Google Chrome ou Microsoft Edge atualizados.');
    }
    try {
      // Abre o seletor nativo do Chrome para escolher a porta USB da placa
      portaSerial = await navigator.serial.requestPort();
      await portaSerial.open({ baudRate: 9600 });

      // marca o sensor como estando em modo real
      _definirModo(sensorId, 'real');

      const decoder = new TextDecoderStream();
      const streamFechado = portaSerial.readable.pipeTo(decoder.writable);
      leitor = decoder.readable.getReader();

      let bufferLinha = '';
      // laço de leitura contínua da porta série (executa em segundo plano)
      (async function lerContinuamente() {
        try {
          while (true) {
            const { value, done } = await leitor.read();
            if (done) break;
            bufferLinha += value;
            let indiceQuebra;
            // processa cada linha completa recebida da placa
            while ((indiceQuebra = bufferLinha.indexOf('\n')) >= 0) {
              const linha = bufferLinha.slice(0, indiceQuebra).trim();
              bufferLinha = bufferLinha.slice(indiceQuebra + 1);
              _processarLinhaSerial(sensorId, linha);
            }
          }
        } catch (erroLeitura) {
          console.error('Erro na leitura da porta série:', erroLeitura);
        }
      })();

      return FloodDB.ok(true);
    } catch (erro) {
      console.error(erro);
      return FloodDB.fail('Não foi possível ligar ao dispositivo: ' + erro.message);
    }
  }

  /** Interpreta a linha de texto recebida da placa (formato JSON esperado) */
  function _processarLinhaSerial(sensorId, linha) {
    if (!linha) return;
    try {
      // Formato esperado vindo do Arduino/ESP32: {"nivel": 0.87}
      const json = JSON.parse(linha);
      const nivel = parseFloat(json.nivel);
      if (!isNaN(nivel)) {
        _atualizarNivel(sensorId, nivel, 'real');
      }
    } catch (e) {
      // Também aceita um número simples enviado em texto puro (ex: "87\n")
      const nivelSimples = parseFloat(linha);
      if (!isNaN(nivelSimples)) {
        _atualizarNivel(sensorId, nivelSimples / 100, 'real');
      }
    }
  }

  /** Fecha a ligação com o dispositivo real ligado por USB */
  async function desconectarDispositivoReal(sensorId) {
    try {
      if (leitor) { await leitor.cancel(); leitor = null; }
      if (portaSerial) { await portaSerial.close(); portaSerial = null; }
      _definirModo(sensorId, 'simulacao');
      return FloodDB.ok(true);
    } catch (e) {
      return FloodDB.fail('Erro ao desconectar: ' + e.message);
    }
  }

  function _definirModo(sensorId, modo) {
    const sensores = listar();
    const idx = sensores.findIndex(s => s.id === sensorId);
    if (idx !== -1) {
      sensores[idx].modo = modo;
      FloodDB._write(FloodDB.TABLES.SENSORS, sensores);
    }
  }

  // =====================================================
  //  MODO SIMULAÇÃO (sem hardware)
  // =====================================================

  /**
   * Inicia a simulação de subida/descida do nível de água para um
   * sensor específico, útil para demonstrações e testes do sistema
   * de alerta sem necessidade de hardware físico ligado.
   */
  function iniciarSimulacao(sensorId, tendencia = 'subir') {
    pararSimulacao(sensorId); // evita duplicar o intervalo

    simulacaoIntervalos[sensorId] = setInterval(() => {
      const sensores = listar();
      const sensor = sensores.find(s => s.id === sensorId);
      if (!sensor) { pararSimulacao(sensorId); return; }

      // variação aleatória, tendendo a subir ou descer conforme escolhido
      const variacao = (Math.random() * 0.08) * (tendencia === 'subir' ? 1 : -1);
      let novoNivel = Math.max(0, sensor.nivelAtual + variacao);
      novoNivel = Math.round(novoNivel * 100) / 100;

      _atualizarNivel(sensorId, novoNivel, 'simulacao');
    }, 3000); // atualiza a cada 3 segundos
  }

  /** Para a simulação de um sensor */
  function pararSimulacao(sensorId) {
    if (simulacaoIntervalos[sensorId]) {
      clearInterval(simulacaoIntervalos[sensorId]);
      delete simulacaoIntervalos[sensorId];
    }
  }

  /** Classifica o estado de um sensor com base nos seus limites */
  function classificarEstado(sensor) {
    if (sensor.nivelAtual >= sensor.limiteCritico) return 'critico';
    if (sensor.nivelAtual >= sensor.limiteAlerta) return 'alerta';
    return 'normal';
  }

  return {
    listar, adicionar, remover, suportaSerial,
    conectarDispositivoReal, desconectarDispositivoReal,
    iniciarSimulacao, pararSimulacao, classificarEstado, emitirBeep
  };
})();
