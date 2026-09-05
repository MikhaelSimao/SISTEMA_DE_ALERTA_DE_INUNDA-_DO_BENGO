/**
 * =============================================================
 *  boletins.js - MÓDULO "CRIAR E BUSCAR BOLETIM"
 * =============================================================
 * Boletins são comunicados informativos sobre a situação
 * hídrica do bairro Mubungo (ex: boletim semanal, boletim de
 * alerta, aviso de subida de nível, etc.).
 * Criação: administrador e técnico.
 * Consulta/pesquisa: todos os perfis autenticados.
 * =============================================================
 */

const FloodBoletins = (() => {

  function listar() {
    return FloodDB._read(FloodDB.TABLES.BOLETINS).sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  function criar(dados) {
    const { titulo, conteudo, categoria, autor } = dados;
    if (!titulo || !conteudo) return FloodDB.fail('Preencha o título e o conteúdo do boletim.');

    const boletins = FloodDB._read(FloodDB.TABLES.BOLETINS);
    const novo = {
      id: FloodDB._uid('bol'),
      titulo, conteudo,
      categoria: categoria || 'Informativo',
      autor: autor || 'Desconhecido',
      data: new Date().toISOString()
    };
    boletins.push(novo);
    FloodDB._write(FloodDB.TABLES.BOLETINS, boletins);
    return FloodDB.ok(novo);
  }

  /** Pesquisa boletins por texto (título, conteúdo ou categoria) */
  function pesquisar(termo) {
    const t = (termo || '').trim().toLowerCase();
    const todos = listar();
    if (!t) return todos;
    return todos.filter(b =>
      b.titulo.toLowerCase().includes(t) ||
      b.conteudo.toLowerCase().includes(t) ||
      b.categoria.toLowerCase().includes(t)
    );
  }

  function remover(id) {
    let boletins = FloodDB._read(FloodDB.TABLES.BOLETINS);
    boletins = boletins.filter(b => b.id !== id);
    FloodDB._write(FloodDB.TABLES.BOLETINS, boletins);
    return FloodDB.ok(true);
  }

  return { listar, criar, pesquisar, remover };
})();
