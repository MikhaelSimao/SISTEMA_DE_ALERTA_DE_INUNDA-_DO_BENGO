/**
 * =============================================================
 *  app.js - NÚCLEO DA APLICAÇÃO (Router SPA e Módulos de Ecrã)
 * =============================================================
 * Este ficheiro é responsável por:
 *  - Controlar a navegação entre o ecrã de autenticação e a
 *    aplicação principal (Single Page Application).
 *  - Construir dinamicamente o menu lateral de acordo com o
 *    nível de acesso (role) do utilizador autenticado.
 *  - Renderizar o conteúdo de cada módulo do sistema.
 * =============================================================
 */

// Definição dos módulos disponíveis para cada nível de acesso.
// Apenas o "admin" tem acesso obrigatório a TODOS os módulos.
const MODULOS_POR_PERFIL = {
  admin:      ['painel', 'usuarios', 'sensores', 'boletins', 'relatorios', 'mapa', 'mensagens', 'perfil'],
  tecnico:    ['painel', 'sensores', 'boletins', 'relatorios', 'mapa', 'mensagens', 'perfil'],
  voluntario: ['painel', 'boletins', 'relatorios', 'mapa', 'mensagens', 'perfil'],
  usuario:    ['painel', 'consulta-publica', 'relatorios', 'mapa', 'mensagens', 'perfil']
};

// Metadados de cada módulo: ícone (Bootstrap Icons) e chave de tradução
const META_MODULOS = {
  'painel':            { icone: 'bi-speedometer2',      chave: 'menu_painel' },
  'usuarios':          { icone: 'bi-people-fill',        chave: 'menu_usuarios' },
  'sensores':          { icone: 'bi-broadcast-pin',      chave: 'menu_sensores' },
  'boletins':          { icone: 'bi-newspaper',          chave: 'menu_boletins' },
  'relatorios':        { icone: 'bi-file-earmark-text',  chave: 'menu_relatorios' },
  'mapa':              { icone: 'bi-map-fill',           chave: 'menu_mapa' },
  'mensagens':         { icone: 'bi-chat-dots-fill',     chave: 'menu_mensagens' },
  'perfil':            { icone: 'bi-person-circle',      chave: 'menu_perfil' },
  'consulta-publica':  { icone: 'bi-megaphone-fill',     chave: 'menu_boletins' }
};

let moduloAtual = 'painel';

/* ===================== INICIALIZAÇÃO ===================== */

document.addEventListener('DOMContentLoaded', () => {
  FloodTheme.aplicar();
  FloodI18n.aplicar();
  atualizarEcraAtivo();
  ligarEventosGlobais();
});

/** Decide se mostra o ecrã de autenticação ou a aplicação, conforme a sessão */
function atualizarEcraAtivo() {
  const sessao = FloodAuth.getSessao();
  const telaAuth = document.getElementById('tela-autenticacao');
  const telaApp = document.getElementById('tela-aplicacao');

  if (sessao) {
    telaAuth.classList.add('d-none');
    telaApp.classList.remove('d-none');
    montarSidebar(sessao);
    preencherCabecalhoUsuario(sessao);
    navegarPara('painel');
  } else {
    telaAuth.classList.remove('d-none');
    telaApp.classList.add('d-none');
    // Garante que os formulários de autenticação nunca fiquem pré-preenchidos
    limparFormulariosAuth();
    mostrarPainelAuth('login');
  }
  FloodI18n.aplicar();
}

/** Limpa todos os campos dos formulários de autenticação (segurança e usabilidade) */
function limparFormulariosAuth() {
  document.querySelectorAll('#tela-autenticacao form').forEach(f => f.reset());
}

/* ===================== NAVEGAÇÃO ENTRE PAINÉIS DE AUTENTICAÇÃO ===================== */

function mostrarPainelAuth(painel) {
  ['login', 'registo', 'recuperar'].forEach(p => {
    document.getElementById(`painel-${p}`).classList.toggle('d-none', p !== painel);
  });
  limparFormulariosAuth();
}

/* ===================== MENU LATERAL (SIDEBAR) ===================== */

/** Constrói o menu lateral dinamicamente, mostrando apenas os módulos permitidos ao perfil do utilizador */
function montarSidebar(sessao) {
  const modulos = MODULOS_POR_PERFIL[sessao.role] || [];
  const nav = document.getElementById('menu-lateral-nav');
  nav.innerHTML = '';

  modulos.forEach(mod => {
    const meta = META_MODULOS[mod];
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'nav-link sidebar-link d-flex align-items-center gap-2';
    item.dataset.modulo = mod;
    item.innerHTML = `<i class="bi ${meta.icone}"></i><span class="sidebar-texto" data-i18n="${meta.chave}"></span>`;
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navegarPara(mod);
    });
    nav.appendChild(item);
  });

  // Badge do nível de acesso no topo da sidebar
  document.getElementById('sidebar-badge-role').textContent = _nomeAmigavelRole(sessao.role);
}

function _nomeAmigavelRole(role) {
  const nomes = { admin: 'Administrador', tecnico: 'Técnico', voluntario: 'Voluntário', usuario: 'Usuário' };
  return nomes[role] || role;
}

/** Preenche o cabeçalho (topbar) com o nome e foto do utilizador autenticado */
function preencherCabecalhoUsuario(sessao) {
  document.getElementById('topbar-nome-usuario').textContent = sessao.nome;
  const img = document.getElementById('topbar-foto-usuario');
  img.src = sessao.foto || 'assets/icons/avatar-padrao.svg';
}

/** Navega para um módulo, respeitando as permissões do utilizador autenticado */
function navegarPara(modulo) {
  const sessao = FloodAuth.getSessao();
  if (!sessao) return;

  const permitidos = MODULOS_POR_PERFIL[sessao.role] || [];
  if (!permitidos.includes(modulo)) {
    modulo = 'painel'; // fallback de segurança caso tentem aceder a um módulo não permitido
  }

  moduloAtual = modulo;

  // Marca visualmente o item ativo no menu lateral
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const linkAtivo = document.querySelector(`.sidebar-link[data-modulo="${modulo}"]`);
  if (linkAtivo) linkAtivo.classList.add('active');

  const container = document.getElementById('conteudo-principal');
  container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  // Pequeno atraso simbólico para transição suave entre módulos
  setTimeout(() => {
    switch (modulo) {
      case 'painel': renderPainel(container, sessao); break;
      case 'usuarios': renderUsuarios(container, sessao); break;
      case 'sensores': renderSensores(container, sessao); break;
      case 'boletins': renderBoletins(container, sessao); break;
      case 'consulta-publica': renderConsultaPublica(container, sessao); break;
      case 'relatorios': renderRelatorios(container, sessao); break;
      case 'mapa': renderMapa(container, sessao); break;
      case 'mensagens': renderMensagens(container, sessao); break;
      case 'perfil': renderPerfil(container, sessao); break;
      default: container.innerHTML = '<p>Módulo não encontrado.</p>';
    }
    FloodI18n.aplicar();
  }, 150);
}

/* ===================== EVENTOS GLOBAIS ===================== */

function ligarEventosGlobais() {
  // Alternância de painéis de autenticação
  document.getElementById('link-ir-registo').addEventListener('click', (e) => { e.preventDefault(); mostrarPainelAuth('registo'); });
  document.getElementById('link-ir-recuperar').addEventListener('click', (e) => { e.preventDefault(); mostrarPainelAuth('recuperar'); });
  document.getElementById('link-voltar-login-1').addEventListener('click', (e) => { e.preventDefault(); mostrarPainelAuth('login'); });
  document.getElementById('link-voltar-login-2').addEventListener('click', (e) => { e.preventDefault(); mostrarPainelAuth('login'); });

  // Submissão do formulário de login
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const resultado = FloodAuth.login(email, senha);
    const caixaErro = document.getElementById('login-erro');
    if (!resultado.sucesso) {
      caixaErro.textContent = resultado.mensagem;
      caixaErro.classList.remove('d-none');
      return;
    }
    caixaErro.classList.add('d-none');
    atualizarEcraAtivo();
  });

  // Submissão do formulário de registo (com foto de perfil opcional)
  document.getElementById('form-registo').addEventListener('submit', (e) => {
    e.preventDefault();
    const ficheiroFoto = document.getElementById('registo-foto').files[0];
    const construir = (fotoBase64) => {
      const dados = {
        nome: document.getElementById('registo-nome').value,
        email: document.getElementById('registo-email').value,
        senha: document.getElementById('registo-senha').value,
        confirmarSenha: document.getElementById('registo-confirmar-senha').value,
        telefone: document.getElementById('registo-telefone').value,
        perguntaSeguranca: document.getElementById('registo-pergunta').value,
        respostaSeguranca: document.getElementById('registo-resposta').value,
        foto: fotoBase64 || null
      };
      const resultado = FloodAuth.registar(dados);
      const caixa = document.getElementById('registo-mensagem');
      caixa.classList.remove('d-none', 'alert-success', 'alert-danger');
      if (!resultado.sucesso) {
        caixa.textContent = resultado.mensagem;
        caixa.classList.add('alert-danger');
      } else {
        caixa.textContent = 'Conta criada com sucesso! Já pode iniciar sessão.';
        caixa.classList.add('alert-success');
        setTimeout(() => mostrarPainelAuth('login'), 1800);
      }
    };
    if (ficheiroFoto) {
      const leitor = new FileReader();
      leitor.onload = () => construir(leitor.result);
      leitor.readAsDataURL(ficheiroFoto);
    } else {
      construir(null);
    }
  });

  // Recuperação de senha - passo 1: localizar conta pelo e-mail
  document.getElementById('form-recuperar-passo1').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('recuperar-email').value;
    const resultado = FloodAuth.obterPerguntaSeguranca(email);
    const caixa = document.getElementById('recuperar-erro-1');
    if (!resultado.sucesso) {
      caixa.textContent = resultado.mensagem;
      caixa.classList.remove('d-none');
      return;
    }
    caixa.classList.add('d-none');
    document.getElementById('recuperar-pergunta-texto').textContent = resultado.dados.pergunta;
    document.getElementById('recuperar-email-oculto').value = email;
    document.getElementById('bloco-recuperar-passo1').classList.add('d-none');
    document.getElementById('bloco-recuperar-passo2').classList.remove('d-none');
  });

  // Recuperação de senha - passo 2: validar resposta e redefinir
  document.getElementById('form-recuperar-passo2').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('recuperar-email-oculto').value;
    const resposta = document.getElementById('recuperar-resposta').value;
    const novaSenha = document.getElementById('recuperar-nova-senha').value;
    const confirmar = document.getElementById('recuperar-confirmar-senha').value;
    const resultado = FloodAuth.redefinirSenha(email, resposta, novaSenha, confirmar);
    const caixa = document.getElementById('recuperar-erro-2');
    if (!resultado.sucesso) {
      caixa.textContent = resultado.mensagem;
      caixa.classList.remove('d-none');
      return;
    }
    caixa.classList.add('d-none');
    alert('Senha redefinida com sucesso! Pode agora iniciar sessão.');
    document.getElementById('bloco-recuperar-passo1').classList.remove('d-none');
    document.getElementById('bloco-recuperar-passo2').classList.add('d-none');
    mostrarPainelAuth('login');
  });

  // Botão de logout (posição alterada: agora fixo no topo direito da barra superior)
  document.getElementById('btn-logout').addEventListener('click', () => {
    FloodAuth.logout();
    atualizarEcraAtivo();
  });

  // Alternância de tema (liga a TODAS as instâncias do botão - login e topbar)
  document.querySelectorAll('.btn-alternar-tema').forEach(btn => {
    btn.addEventListener('click', () => FloodTheme.alternar());
  });

  // Alternância de idioma (liga a TODAS as instâncias do seletor - login e topbar)
  document.querySelectorAll('.seletor-idioma').forEach(sel => {
    sel.addEventListener('change', (e) => FloodI18n.mudarIdioma(e.target.value));
  });

  // Escuta atualizações de leitura de sensores para refrescar o painel em tempo real
  document.addEventListener('flood:leitura-atualizada', () => {
    if (moduloAtual === 'painel' || moduloAtual === 'sensores' || moduloAtual === 'mapa') {
      navegarPara(moduloAtual);
    }
  });
}
