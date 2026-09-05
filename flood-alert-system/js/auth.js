/**
 * =============================================================
 *  auth.js - MÓDULO DE AUTENTICAÇÃO E GESTÃO DE SESSÃO
 * =============================================================
 * Responsável por:
 *   - Login (com validação obrigatória de e-mail e senha)
 *   - Registo de nova conta
 *   - Recuperação de senha/conta (pergunta de segurança)
 *   - Controlo da sessão do utilizador autenticado
 *
 * IMPORTANTE: a sessão é guardada em sessionStorage (não em
 * localStorage) e é sempre limpa ao carregar a página de login,
 * para que os campos de e-mail/senha NUNCA apareçam
 * pré-preenchidos e para que dados de um utilizador anterior
 * nunca fiquem visíveis sem autenticação explícita.
 * =============================================================
 */

const FloodAuth = (() => {

  const SESSION_KEY = 'fa_sessao_ativa';

  /** Devolve o utilizador atualmente autenticado (ou null) */
  function getSessao() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Grava a sessão do utilizador autenticado */
  function _setSessao(user) {
    // Nunca guardamos a senha (nem o hash) na sessão exposta ao ecrã
    const seguro = { ...user };
    delete seguro.senha;
    delete seguro.respostaSeguranca;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(seguro));
  }

  /** Termina a sessão do utilizador (logout) */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /**
   * Autentica um utilizador.
   * Valida obrigatoriamente que e-mail e senha foram preenchidos
   * (nunca aceita campos vazios ou pré-carregados automaticamente).
   */
  function login(email, senha) {
    email = (email || '').trim();
    senha = (senha || '').trim();

    if (!email || !senha) {
      return FloodDB.fail('Por favor, preencha o e-mail e a senha.');
    }

    const users = FloodDB._read(FloodDB.TABLES.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) return FloodDB.fail('Conta não encontrada. Verifique o e-mail.');
    if (!user.ativo) return FloodDB.fail('Esta conta encontra-se desativada. Contacte o administrador.');
    if (user.senha !== FloodDB._hash(senha)) return FloodDB.fail('Senha incorreta.');

    _setSessao(user);
    return FloodDB.ok(user);
  }

  /**
   * Regista uma nova conta no sistema.
   * Por defeito o papel (role) de contas auto-registadas é "usuario";
   * apenas o administrador pode promover para tecnico/voluntario/admin
   * no módulo "Gerir Usuários".
   */
  function registar(dados) {
    const { nome, email, senha, confirmarSenha, telefone, perguntaSeguranca, respostaSeguranca, foto } = dados;

    if (!nome || !email || !senha || !confirmarSenha || !perguntaSeguranca || !respostaSeguranca) {
      return FloodDB.fail('Preencha todos os campos obrigatórios.');
    }
    if (senha !== confirmarSenha) {
      return FloodDB.fail('As senhas não coincidem.');
    }
    if (senha.length < 6) {
      return FloodDB.fail('A senha deve ter pelo menos 6 caracteres.');
    }

    const users = FloodDB._read(FloodDB.TABLES.USERS);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return FloodDB.fail('Já existe uma conta registada com este e-mail.');
    }

    const novo = {
      id: FloodDB._uid('usr'),
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: FloodDB._hash(senha),
      role: 'usuario',
      foto: foto || null,
      telefone: telefone || '',
      perguntaSeguranca,
      respostaSeguranca: FloodDB._hash(respostaSeguranca.trim().toLowerCase()),
      criadoEm: new Date().toISOString(),
      ativo: true
    };

    users.push(novo);
    FloodDB._write(FloodDB.TABLES.USERS, users);
    return FloodDB.ok(novo);
  }

  /** Passo 1 da recuperação: obter a pergunta de segurança do e-mail indicado */
  function obterPerguntaSeguranca(email) {
    const users = FloodDB._read(FloodDB.TABLES.USERS);
    const user = users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase());
    if (!user) return FloodDB.fail('Não existe nenhuma conta com este e-mail.');
    return FloodDB.ok({ pergunta: user.perguntaSeguranca });
  }

  /** Passo 2 da recuperação: validar resposta e definir nova senha */
  function redefinirSenha(email, resposta, novaSenha, confirmarNovaSenha) {
    if (!resposta || !novaSenha || !confirmarNovaSenha) {
      return FloodDB.fail('Preencha todos os campos.');
    }
    if (novaSenha !== confirmarNovaSenha) {
      return FloodDB.fail('As novas senhas não coincidem.');
    }
    const users = FloodDB._read(FloodDB.TABLES.USERS);
    const idx = users.findIndex(u => u.email.toLowerCase() === (email || '').trim().toLowerCase());
    if (idx === -1) return FloodDB.fail('Conta não encontrada.');

    if (users[idx].respostaSeguranca !== FloodDB._hash(resposta.trim().toLowerCase())) {
      return FloodDB.fail('Resposta de segurança incorreta.');
    }

    users[idx].senha = FloodDB._hash(novaSenha);
    FloodDB._write(FloodDB.TABLES.USERS, users);
    return FloodDB.ok(true);
  }

  /** Verifica se o utilizador autenticado possui um determinado papel */
  function temPermissao(rolesPermitidos) {
    const sessao = getSessao();
    if (!sessao) return false;
    return rolesPermitidos.includes(sessao.role);
  }

  return { getSessao, logout, login, registar, obterPerguntaSeguranca, redefinirSenha, temPermissao };
})();
