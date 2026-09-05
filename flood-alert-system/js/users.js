/**
 * =============================================================
 *  users.js - MÓDULO "GERIR USUÁRIOS" (apenas Administrador)
 * =============================================================
 * Permite ao administrador: listar, criar, editar, ativar/
 * desativar, atribuir papéis (role) e definir a foto de perfil
 * de qualquer utilizador do sistema.
 * =============================================================
 */

const FloodUsers = (() => {

  /** Lista todos os utilizadores (sem expor a senha em produção real) */
  function listar() {
    return FloodDB._read(FloodDB.TABLES.USERS);
  }

  /** Devolve um utilizador pelo id */
  function obter(id) {
    return listar().find(u => u.id === id) || null;
  }

  /** Cria um utilizador diretamente pelo administrador, já com o papel definido */
  function criar(dados) {
    const { nome, email, senha, role, telefone, foto } = dados;
    if (!nome || !email || !senha || !role) {
      return FloodDB.fail('Preencha nome, e-mail, senha e nível de acesso.');
    }
    const users = listar();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return FloodDB.fail('Já existe um utilizador com este e-mail.');
    }
    const novo = {
      id: FloodDB._uid('usr'),
      nome, email: email.toLowerCase(),
      senha: FloodDB._hash(senha),
      role, foto: foto || null, telefone: telefone || '',
      perguntaSeguranca: 'Qual é o nome do seu bairro?',
      respostaSeguranca: FloodDB._hash('mubungo'),
      criadoEm: new Date().toISOString(),
      ativo: true
    };
    users.push(novo);
    FloodDB._write(FloodDB.TABLES.USERS, users);
    return FloodDB.ok(novo);
  }

  /** Atualiza dados de um utilizador existente (nome, role, foto, telefone, estado) */
  function atualizar(id, dados) {
    const users = listar();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return FloodDB.fail('Utilizador não encontrado.');

    if (dados.nome) users[idx].nome = dados.nome;
    if (dados.role) users[idx].role = dados.role;
    if (dados.telefone !== undefined) users[idx].telefone = dados.telefone;
    if (dados.foto !== undefined) users[idx].foto = dados.foto;
    if (dados.ativo !== undefined) users[idx].ativo = dados.ativo;
    if (dados.senha) users[idx].senha = FloodDB._hash(dados.senha);

    FloodDB._write(FloodDB.TABLES.USERS, users);
    return FloodDB.ok(users[idx]);
  }

  /** Remove definitivamente um utilizador */
  function remover(id) {
    let users = listar();
    users = users.filter(u => u.id !== id);
    FloodDB._write(FloodDB.TABLES.USERS, users);
    return FloodDB.ok(true);
  }

  return { listar, obter, criar, atualizar, remover };
})();
