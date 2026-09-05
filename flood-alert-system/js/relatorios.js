/**
 * =============================================================
 *  relatorios.js - MÓDULO "EMITIR E PESQUISAR RELATÓRIOS"
 * =============================================================
 * Relatórios registam ocorrências no terreno (ex: subida de
 * água numa rua, danos, pedidos de assistência) reportadas por
 * técnicos, voluntários ou moradores.
 *
 * Também disponibiliza a impressão do relatório através de:
 *   - Wi-Fi / impressora de rede: usa o diálogo de impressão
 *     nativo do navegador (window.print), que permite escolher
 *     qualquer impressora configurada no sistema operativo,
 *     incluindo impressoras de rede/Wi-Fi.
 *   - Bluetooth: usa a Web Bluetooth API (navigator.bluetooth)
 *     para emparelhar diretamente com uma impressora térmica
 *     Bluetooth compatível com o perfil GATT de impressão.
 * =============================================================
 */

const FloodRelatorios = (() => {

  function listar() {
    return FloodDB._read(FloodDB.TABLES.RELATORIOS).sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  /** Emite (cria) um novo relatório */
  function emitir(dados) {
    const { titulo, tipo, conteudo, autor, localizacao } = dados;
    if (!titulo || !conteudo) return FloodDB.fail('Preencha o título e a descrição do relatório.');

    const relatorios = FloodDB._read(FloodDB.TABLES.RELATORIOS);
    const novo = {
      id: FloodDB._uid('rel'),
      titulo,
      tipo: tipo || 'Ocorrência',
      conteudo,
      localizacao: localizacao || 'Bairro Mubungo',
      autor: autor || 'Desconhecido',
      status: 'Aberto',
      data: new Date().toISOString()
    };
    relatorios.push(novo);
    FloodDB._write(FloodDB.TABLES.RELATORIOS, relatorios);
    return FloodDB.ok(novo);
  }

  /** Pesquisa relatórios por texto, tipo ou status */
  function pesquisar(termo, filtroStatus) {
    const t = (termo || '').trim().toLowerCase();
    let resultados = listar();
    if (t) {
      resultados = resultados.filter(r =>
        r.titulo.toLowerCase().includes(t) ||
        r.conteudo.toLowerCase().includes(t) ||
        r.tipo.toLowerCase().includes(t) ||
        r.localizacao.toLowerCase().includes(t)
      );
    }
    if (filtroStatus && filtroStatus !== 'todos') {
      resultados = resultados.filter(r => r.status === filtroStatus);
    }
    return resultados;
  }

  function atualizarStatus(id, novoStatus) {
    const relatorios = FloodDB._read(FloodDB.TABLES.RELATORIOS);
    const idx = relatorios.findIndex(r => r.id === id);
    if (idx === -1) return FloodDB.fail('Relatório não encontrado.');
    relatorios[idx].status = novoStatus;
    FloodDB._write(FloodDB.TABLES.RELATORIOS, relatorios);
    return FloodDB.ok(relatorios[idx]);
  }

  /**
   * Imprime um relatório usando a impressora padrão do sistema
   * operativo (rede/Wi-Fi/USB) através do diálogo nativo do
   * navegador Chrome.
   */
  function imprimirViaWifi(relatorio) {
    const janela = window.open('', '_blank', 'width=700,height=900');
    janela.document.write(`
      <html>
        <head>
          <title>Relatório - ${relatorio.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color:#222; }
            h1 { font-size: 20px; border-bottom: 2px solid #0d6efd; padding-bottom: 8px; }
            .campo { margin-bottom: 10px; }
            .campo b { display:inline-block; width: 140px; }
          </style>
        </head>
        <body>
          <h1>Sistema de Alerta de Inundação - Bairro Mubungo, Bengo</h1>
          <div class="campo"><b>Título:</b> ${relatorio.titulo}</div>
          <div class="campo"><b>Tipo:</b> ${relatorio.tipo}</div>
          <div class="campo"><b>Localização:</b> ${relatorio.localizacao}</div>
          <div class="campo"><b>Autor:</b> ${relatorio.autor}</div>
          <div class="campo"><b>Data:</b> ${new Date(relatorio.data).toLocaleString('pt-PT')}</div>
          <div class="campo"><b>Status:</b> ${relatorio.status}</div>
          <hr/>
          <p>${relatorio.conteudo}</p>
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    janela.print();
  }

  /**
   * Tenta imprimir via impressora térmica Bluetooth, usando a
   * Web Bluetooth API para emparelhar com o dispositivo e enviar
   * os dados em texto simples (ESC/POS simplificado).
   * Requer que o computador/telemóvel tenha Bluetooth ativo e
   * que o Chrome tenha permissão de acesso a dispositivos Bluetooth.
   */
  async function imprimirViaBluetooth(relatorio) {
    if (!navigator.bluetooth) {
      return FloodDB.fail('Este navegador/dispositivo não suporta Web Bluetooth. Utilize o Google Chrome em Windows, Android ou ChromeOS.');
    }
    try {
      // Solicita ao utilizador que escolha a impressora Bluetooth
      const dispositivo = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // serviço comum de impressoras térmicas
      });

      const servidor = await dispositivo.gatt.connect();
      const texto = `RELATORIO: ${relatorio.titulo}\nTipo: ${relatorio.tipo}\nLocal: ${relatorio.localizacao}\nAutor: ${relatorio.autor}\nData: ${new Date(relatorio.data).toLocaleString('pt-PT')}\n\n${relatorio.conteudo}\n\n`;

      // Tenta localizar o serviço/característica de impressão comum
      const servico = await servidor.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const caracteristica = await servico.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const codificador = new TextEncoder();
      await caracteristica.writeValue(codificador.encode(texto));

      return FloodDB.ok(true);
    } catch (erro) {
      console.error(erro);
      return FloodDB.fail('Não foi possível imprimir via Bluetooth: ' + erro.message + '. Verifique se a impressora é compatível ou utilize a opção Wi-Fi.');
    }
  }

  return { listar, emitir, pesquisar, atualizarStatus, imprimirViaWifi, imprimirViaBluetooth };
})();
