/**
 * =============================================================
 *  db.js - CAMADA DE "BACKEND" DO SISTEMA (Base de Dados local)
 * =============================================================
 * Esta camada simula um backend eficiente usando localStorage
 * do navegador como motor de persistência. Foi desenhada em
 * formato de "API" (funções, respostas padronizadas) para que
 * possa, no futuro, ser substituída por chamadas reais a um
 * servidor (Node.js/Express + MySQL/MongoDB) sem alterar o
 * resto do sistema — basta trocar o conteúdo destas funções
 * por fetch() a uma API REST real, mantendo os mesmos nomes.
 *
 * Tabelas (chaves) da base de dados:
 *  - users      -> utilizadores (admin, tecnico, usuario, voluntario)
 *  - sensors    -> sensores de nível de água (Arduino/ESP32)
 *  - leituras   -> histórico de leituras dos sensores
 *  - boletins   -> boletins informativos
 *  - relatorios -> relatórios técnicos/ocorrências
 *  - mensagens  -> mensagens de suporte
 *  - config     -> configurações gerais (tema, idioma)
 * =============================================================
 */

const FloodDB = (() => {

  // Nomes das "tabelas" usados como chaves no localStorage
  const TABLES = {
    USERS: 'fa_users',
    SENSORS: 'fa_sensors',
    LEITURAS: 'fa_leituras',
    BOLETINS: 'fa_boletins',
    RELATORIOS: 'fa_relatorios',
    MENSAGENS: 'fa_mensagens',
    CONFIG: 'fa_config',
    SEED: 'fa_seeded'
  };

  /** Lê uma tabela do localStorage; devolve array vazio se ainda não existir */
  function _read(table) {
    try {
      const raw = localStorage.getItem(table);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Erro ao ler tabela', table, e);
      return [];
    }
  }

  /** Escreve (persiste) uma tabela inteira no localStorage */
  function _write(table, data) {
    localStorage.setItem(table, JSON.stringify(data));
  }

  /** Gera um identificador único simples (timestamp + aleatório) */
  function _uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  /** "Hash" simples da senha (em produção real usar bcrypt no servidor) */
  function _hash(texto) {
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
      hash = (hash << 5) - hash + texto.charCodeAt(i);
      hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(16);
  }

  /** Resposta padronizada de sucesso, ao estilo de uma API REST */
  function ok(dados) { return { sucesso: true, dados }; }
  /** Resposta padronizada de erro */
  function fail(mensagem) { return { sucesso: false, mensagem }; }

  /**
   * Popula a base de dados com dados iniciais (seed), apenas
   * na primeira execução do sistema no navegador do utilizador.
   */
  function seed() {
    if (localStorage.getItem(TABLES.SEED)) return; // já foi semeado antes

    const agora = new Date().toISOString();
    const perguntaPadrao = 'Qual é o nome do seu bairro?';

    const users = [
      { id: _uid('usr'), nome: 'Administrador Geral', email: 'admin@bengo.gov.ao',
        senha: _hash('Admin@123'), role: 'admin', foto: null, telefone: '923000000',
        perguntaSeguranca: perguntaPadrao, respostaSeguranca: _hash('mubungo'),
        criadoEm: agora, ativo: true },
      { id: _uid('usr'), nome: 'Técnico de Sensores', email: 'tecnico@bengo.gov.ao',
        senha: _hash('Tecnico@123'), role: 'tecnico', foto: null, telefone: '923111111',
        perguntaSeguranca: perguntaPadrao, respostaSeguranca: _hash('mubungo'),
        criadoEm: agora, ativo: true },
      { id: _uid('usr'), nome: 'Voluntário Comunitário', email: 'voluntario@bengo.gov.ao',
        senha: _hash('Voluntario@123'), role: 'voluntario', foto: null, telefone: '923222222',
        perguntaSeguranca: perguntaPadrao, respostaSeguranca: _hash('mubungo'),
        criadoEm: agora, ativo: true },
      { id: _uid('usr'), nome: 'Morador Mubungo', email: 'usuario@bengo.gov.ao',
        senha: _hash('Usuario@123'), role: 'usuario', foto: null, telefone: '923333333',
        perguntaSeguranca: perguntaPadrao, respostaSeguranca: _hash('mubungo'),
        criadoEm: agora, ativo: true }
    ];
    _write(TABLES.USERS, users);

    const sensors = [
      { id: _uid('sen'), nome: 'Sensor Rio Mubungo - Ponto 1',
        localizacao: 'Bairro Mubungo, próximo à ponte', tipo: 'Ultrassônico (HC-SR04)',
        dispositivo: 'ESP32', latitude: -8.6115, longitude: 13.6905,
        nivelAtual: 0.35, unidade: 'm', limiteAlerta: 1.5, limiteCritico: 2.5,
        status: 'ativo', modo: 'simulacao', portaSerial: null, ultimaLeitura: agora },
      { id: _uid('sen'), nome: 'Sensor Zona Baixa Mubungo',
        localizacao: 'Bairro Mubungo, zona baixa', tipo: 'Ultrassônico (HC-SR04)',
        dispositivo: 'Arduino Uno', latitude: -8.6142, longitude: 13.6931,
        nivelAtual: 0.2, unidade: 'm', limiteAlerta: 1.2, limiteCritico: 2.0,
        status: 'ativo', modo: 'simulacao', portaSerial: null, ultimaLeitura: agora }
    ];
    _write(TABLES.SENSORS, sensors);
    _write(TABLES.LEITURAS, []);

    const boletins = [
      { id: _uid('bol'), titulo: 'Boletim Semanal - Situação Hídrica do Bengo',
        conteudo: 'Os níveis de água nos pontos monitorizados do bairro Mubungo mantêm-se dentro dos parâmetros normais nesta semana.',
        categoria: 'Informativo', autor: 'Técnico de Sensores', data: agora }
    ];
    _write(TABLES.BOLETINS, boletins);
    _write(TABLES.RELATORIOS, []);
    _write(TABLES.MENSAGENS, []);
    _write(TABLES.CONFIG, { tema: 'claro', idioma: 'pt' });

    localStorage.setItem(TABLES.SEED, '1');
  }

  return { TABLES, _read, _write, _uid, _hash, ok, fail, seed };
})();

// Semeia a base de dados assim que o script é carregado no navegador
FloodDB.seed();
