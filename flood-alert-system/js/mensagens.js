/**
 * =============================================================
 *  mensagens.js - MÓDULO "MENSAGENS E SUPORTE"
 * =============================================================
 * Conforme solicitado, este módulo foi simplificado para conter
 * apenas três funcionalidades:
 *   1) Listagem de mensagens (registo/histórico)
 *   2) Registar uma nova mensagem de suporte
 *   3) Enviar a mensagem (marcá-la como enviada ao suporte técnico)
 * =============================================================
 */

const FloodMensagens = (() => {

  function listar() {
    return FloodDB._read(FloodDB.TABLES.MENSAGENS).sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  /** Regista uma nova mensagem no sistema (fica como rascunho) */
  function registar(dados) {
    const { autor, assunto, texto } = dados;
    if (!autor || !assunto || !texto) return FloodDB.fail('Preencha o assunto e a mensagem.');

    const mensagens = FloodDB._read(FloodDB.TABLES.MENSAGENS);
    const nova = {
      id: FloodDB._uid('msg'),
      autor, assunto, texto,
      status: 'registada', // registada -> enviada
      data: new Date().toISOString()
    };
    mensagens.push(nova);
    FloodDB._write(FloodDB.TABLES.MENSAGENS, mensagens);
    return FloodDB.ok(nova);
  }

  /** Marca uma mensagem registada como enviada ao suporte */
  function enviar(id) {
    const mensagens = FloodDB._read(FloodDB.TABLES.MENSAGENS);
    const idx = mensagens.findIndex(m => m.id === id);
    if (idx === -1) return FloodDB.fail('Mensagem não encontrada.');
    mensagens[idx].status = 'enviada';
    mensagens[idx].enviadaEm = new Date().toISOString();
    FloodDB._write(FloodDB.TABLES.MENSAGENS, mensagens);
    return FloodDB.ok(mensagens[idx]);
  }

  return { listar, registar, enviar };
})();
