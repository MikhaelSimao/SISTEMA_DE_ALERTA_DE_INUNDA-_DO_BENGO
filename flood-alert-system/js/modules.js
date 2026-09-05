/**
 * =============================================================
 *  modules.js - RENDERIZAÇÃO DOS MÓDULOS DO SISTEMA
 * =============================================================
 * Cada função "render*" recebe o elemento container onde deve
 * desenhar o HTML do módulo, e a sessão do utilizador autenticado
 * (para saber o que pode ou não fazer dentro do módulo).
 * =============================================================
 */

/* ===================== PAINEL INICIAL (DASHBOARD) ===================== */

function renderPainel(container, sessao) {
  const sensores = FloodSensors.listar();
  const boletins = FloodBoletins.listar().slice(0, 3);
  const relatoriosAbertos = FloodRelatorios.listar().filter(r => r.status === 'Aberto').length;

  const cartoesSensores = sensores.map(s => {
    const estado = FloodSensors.classificarEstado(s);
    const corBadge = estado === 'critico' ? 'danger' : estado === 'alerta' ? 'warning' : 'success';
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm h-100 border-0 card-sensor">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="card-title mb-1">${s.nome}</h6>
              <span class="badge text-bg-${corBadge}">${estado.toUpperCase()}</span>
            </div>
            <p class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> ${s.localizacao}</p>
            <div class="display-6 fw-bold text-primary">${s.nivelAtual.toFixed(2)} <small class="fs-6 text-muted">m</small></div>
            <div class="progress mt-2" style="height:8px;">
              <div class="progress-bar bg-${corBadge}" style="width:${Math.min(100, (s.nivelAtual / s.limiteCritico) * 100)}%"></div>
            </div>
            <p class="small text-muted mt-2 mb-0"><i class="bi bi-cpu"></i> ${s.dispositivo} · ${s.modo === 'real' ? 'Ligação Real' : 'Simulação'}</p>
          </div>
        </div>
      </div>`;
  }).join('') || '<p class="text-muted">Nenhum sensor cadastrado.</p>';

  const listaBoletins = boletins.map(b => `
    <li class="list-group-item">
      <div class="fw-semibold">${b.titulo}</div>
      <div class="small text-muted">${new Date(b.data).toLocaleDateString('pt-PT')} · ${b.categoria}</div>
    </li>`).join('') || '<li class="list-group-item text-muted">Sem boletins.</li>';

  container.innerHTML = `
    <h3 class="mb-1" data-i18n="menu_painel"></h3>
    <p class="text-muted">Bem-vindo(a), ${sessao.nome}. Visão geral da situação hídrica do bairro Mubungo.</p>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm bg-primary-subtle">
          <div class="card-body">
            <div class="text-muted small">Sensores Ativos</div>
            <div class="fs-2 fw-bold">${sensores.length}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm bg-warning-subtle">
          <div class="card-body">
            <div class="text-muted small">Relatórios em Aberto</div>
            <div class="fs-2 fw-bold">${relatoriosAbertos}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm bg-success-subtle">
          <div class="card-body">
            <div class="text-muted small">Estado Geral</div>
            <div class="fs-2 fw-bold">${_estadoGeral(sensores)}</div>
          </div>
        </div>
      </div>
    </div>

    <h5 class="mb-3">Estado dos Sensores</h5>
    <div class="row g-3 mb-4">${cartoesSensores}</div>

    <div class="row g-3">
      <div class="col-md-6">
        <h5>Últimos Boletins</h5>
        <ul class="list-group">${listaBoletins}</ul>
      </div>
      <div class="col-md-6">
        <h5>Mapa Rápido</h5>
        <div id="mini-mapa" style="height:250px;border-radius:10px;overflow:hidden;"></div>
      </div>
    </div>
  `;
  setTimeout(() => FloodMap.iniciar('mini-mapa'), 100);
}

function _estadoGeral(sensores) {
  if (sensores.some(s => FloodSensors.classificarEstado(s) === 'critico')) return 'CRÍTICO';
  if (sensores.some(s => FloodSensors.classificarEstado(s) === 'alerta')) return 'ALERTA';
  return 'NORMAL';
}

/* ===================== GERIR USUÁRIOS (ADMIN) ===================== */

function renderUsuarios(container, sessao) {
  const usuarios = FloodUsers.listar();
  const linhas = usuarios.map(u => `
    <tr>
      <td><img src="${u.foto || 'assets/icons/avatar-padrao.svg'}" class="avatar-tabela" alt="foto"/></td>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td><span class="badge text-bg-secondary">${_nomeAmigavelRole(u.role)}</span></td>
      <td>${u.ativo ? '<span class="badge text-bg-success">Ativo</span>' : '<span class="badge text-bg-danger">Inativo</span>'}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary btn-editar-usuario" data-id="${u.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-remover-usuario" data-id="${u.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 data-i18n="menu_usuarios"></h3>
      <button class="btn btn-primary" id="btn-novo-usuario"><i class="bi bi-person-plus"></i> Novo Usuário</button>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle bg-body">
        <thead><tr><th></th><th>Nome</th><th>E-mail</th><th>Nível</th><th>Estado</th><th></th></tr></thead>
        <tbody>${linhas || '<tr><td colspan="6" class="text-muted text-center">Nenhum usuário.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="modal fade" id="modal-usuario" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title" id="modal-usuario-titulo">Novo Usuário</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="form-usuario">
              <input type="hidden" id="usuario-id"/>
              <div class="mb-2"><label class="form-label">Nome</label>
                <input class="form-control" id="usuario-nome" required autocomplete="off"/></div>
              <div class="mb-2"><label class="form-label">E-mail</label>
                <input type="email" class="form-control" id="usuario-email" required autocomplete="off"/></div>
              <div class="mb-2"><label class="form-label">Senha (deixe em branco para não alterar)</label>
                <input type="password" class="form-control" id="usuario-senha" autocomplete="new-password"/></div>
              <div class="mb-2"><label class="form-label">Telefone</label>
                <input class="form-control" id="usuario-telefone" autocomplete="off"/></div>
              <div class="mb-2"><label class="form-label">Nível de Acesso</label>
                <select class="form-select" id="usuario-role" required>
                  <option value="admin">Administrador</option>
                  <option value="tecnico">Técnico</option>
                  <option value="voluntario">Voluntário</option>
                  <option value="usuario">Usuário</option>
                </select></div>
              <div class="mb-2"><label class="form-label">Foto de Perfil</label>
                <input type="file" class="form-control" id="usuario-foto" accept="image/*"/></div>
              <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="usuario-ativo" checked/>
                <label class="form-check-label">Conta Ativa</label>
              </div>
              <div id="usuario-erro" class="alert alert-danger d-none"></div>
              <button class="btn btn-primary w-100" type="submit">Guardar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const modalEl = document.getElementById('modal-usuario');
  const modal = new bootstrap.Modal(modalEl);

  document.getElementById('btn-novo-usuario').addEventListener('click', () => {
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-id').value = '';
    document.getElementById('modal-usuario-titulo').textContent = 'Novo Usuário';
    document.getElementById('usuario-erro').classList.add('d-none');
    modal.show();
  });

  container.querySelectorAll('.btn-editar-usuario').forEach(btn => {
    btn.addEventListener('click', () => {
      const u = FloodUsers.obter(btn.dataset.id);
      document.getElementById('form-usuario').reset();
      document.getElementById('usuario-id').value = u.id;
      document.getElementById('usuario-nome').value = u.nome;
      document.getElementById('usuario-email').value = u.email;
      document.getElementById('usuario-telefone').value = u.telefone || '';
      document.getElementById('usuario-role').value = u.role;
      document.getElementById('usuario-ativo').checked = u.ativo;
      document.getElementById('modal-usuario-titulo').textContent = 'Editar Usuário';
      document.getElementById('usuario-erro').classList.add('d-none');
      modal.show();
    });
  });

  container.querySelectorAll('.btn-remover-usuario').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja realmente remover este usuário?')) {
        FloodUsers.remover(btn.dataset.id);
        navegarPara('usuarios');
      }
    });
  });

  document.getElementById('form-usuario').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('usuario-id').value;
    const ficheiro = document.getElementById('usuario-foto').files[0];

    const salvar = (fotoBase64) => {
      let resultado;
      const email = document.getElementById('usuario-email').value.trim();
      const nome = document.getElementById('usuario-nome').value.trim();
      if (!id) {
        const senha = document.getElementById('usuario-senha').value;
        if (!senha) {
          document.getElementById('usuario-erro').textContent = 'Defina uma senha para o novo usuário.';
          document.getElementById('usuario-erro').classList.remove('d-none');
          return;
        }
        resultado = FloodUsers.criar({
          nome, email, senha,
          role: document.getElementById('usuario-role').value,
          telefone: document.getElementById('usuario-telefone').value,
          foto: fotoBase64
        });
      } else {
        resultado = FloodUsers.atualizar(id, {
          nome, role: document.getElementById('usuario-role').value,
          telefone: document.getElementById('usuario-telefone').value,
          ativo: document.getElementById('usuario-ativo').checked,
          senha: document.getElementById('usuario-senha').value || undefined,
          foto: fotoBase64 !== undefined ? fotoBase64 : undefined
        });
      }
      if (!resultado.sucesso) {
        document.getElementById('usuario-erro').textContent = resultado.mensagem;
        document.getElementById('usuario-erro').classList.remove('d-none');
        return;
      }
      modal.hide();
      navegarPara('usuarios');
    };

    if (ficheiro) {
      const leitor = new FileReader();
      leitor.onload = () => salvar(leitor.result);
      leitor.readAsDataURL(ficheiro);
    } else {
      salvar(id ? undefined : null);
    }
  });
}

/* ===================== CONFIGURAR SENSORES ===================== */

function renderSensores(container, sessao) {
  const sensores = FloodSensors.listar();
  const suportaSerial = FloodSensors.suportaSerial();

  const linhas = sensores.map(s => {
    const estado = FloodSensors.classificarEstado(s);
    return `
    <tr>
      <td>${s.nome}</td>
      <td>${s.dispositivo}</td>
      <td>${s.nivelAtual.toFixed(2)} m</td>
      <td><span class="badge text-bg-${estado === 'critico' ? 'danger' : estado === 'alerta' ? 'warning' : 'success'}">${estado}</span></td>
      <td><span class="badge text-bg-${s.modo === 'real' ? 'primary' : 'secondary'}">${s.modo === 'real' ? 'Real (USB)' : 'Simulação'}</span></td>
      <td class="text-end">
        ${s.modo === 'real'
          ? `<button class="btn btn-sm btn-outline-danger btn-desconectar" data-id="${s.id}">Desconectar</button>`
          : `<button class="btn btn-sm btn-outline-primary btn-conectar-real" data-id="${s.id}" ${suportaSerial ? '' : 'disabled'}>Conectar USB</button>
             <button class="btn btn-sm btn-outline-secondary btn-simular" data-id="${s.id}">Simular Subida</button>
             <button class="btn btn-sm btn-outline-secondary btn-parar-sim" data-id="${s.id}">Parar</button>`
        }
        <button class="btn btn-sm btn-outline-danger btn-remover-sensor" data-id="${s.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 data-i18n="sensores_titulo"></h3>
      <button class="btn btn-primary" id="btn-novo-sensor"><i class="bi bi-plus-circle"></i> <span data-i18n="sensores_novo"></span></button>
    </div>

    ${!suportaSerial ? `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> O seu navegador não suporta ligação real via USB (Web Serial API). Utilize o Google Chrome ou Microsoft Edge em computador para ligar um Arduino Uno / ESP32 real.</div>` : ''}

    <div class="alert alert-info small">
      <i class="bi bi-info-circle"></i> Para ligação <b>real</b>, carregue no Arduino/ESP32 um firmware que envie continuamente pela porta série uma linha
      no formato <code>{"nivel": 0.87}</code> (nível em metros). Depois clique em "Conectar USB" e selecione a porta do dispositivo.
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle bg-body">
        <thead><tr><th>Sensor</th><th>Dispositivo</th><th>Nível</th><th>Estado</th><th>Modo</th><th></th></tr></thead>
        <tbody>${linhas || '<tr><td colspan="6" class="text-muted text-center">Nenhum sensor.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="modal fade" id="modal-sensor" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Novo Sensor</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="form-sensor">
              <div class="mb-2"><label class="form-label">Nome do Sensor</label><input class="form-control" id="sensor-nome" required/></div>
              <div class="mb-2"><label class="form-label">Localização</label><input class="form-control" id="sensor-localizacao" required/></div>
              <div class="mb-2"><label class="form-label">Dispositivo</label>
                <select class="form-select" id="sensor-dispositivo">
                  <option value="Arduino Uno">Arduino Uno</option>
                  <option value="ESP32">ESP32</option>
                </select></div>
              <div class="row">
                <div class="col-6 mb-2"><label class="form-label">Latitude</label><input class="form-control" id="sensor-lat" value="-8.6128"/></div>
                <div class="col-6 mb-2"><label class="form-label">Longitude</label><input class="form-control" id="sensor-lng" value="13.6918"/></div>
              </div>
              <div class="row">
                <div class="col-6 mb-2"><label class="form-label">Limite de Alerta (m)</label><input class="form-control" id="sensor-alerta" value="1.5"/></div>
                <div class="col-6 mb-2"><label class="form-label">Limite Crítico (m)</label><input class="form-control" id="sensor-critico" value="2.5"/></div>
              </div>
              <button class="btn btn-primary w-100" type="submit">Guardar Sensor</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('modal-sensor'));
  document.getElementById('btn-novo-sensor').addEventListener('click', () => modal.show());

  document.getElementById('form-sensor').addEventListener('submit', (e) => {
    e.preventDefault();
    FloodSensors.adicionar({
      nome: document.getElementById('sensor-nome').value,
      localizacao: document.getElementById('sensor-localizacao').value,
      dispositivo: document.getElementById('sensor-dispositivo').value,
      latitude: document.getElementById('sensor-lat').value,
      longitude: document.getElementById('sensor-lng').value,
      limiteAlerta: document.getElementById('sensor-alerta').value,
      limiteCritico: document.getElementById('sensor-critico').value
    });
    modal.hide();
    navegarPara('sensores');
  });

  container.querySelectorAll('.btn-conectar-real').forEach(btn => {
    btn.addEventListener('click', async () => {
      const resultado = await FloodSensors.conectarDispositivoReal(btn.dataset.id);
      if (!resultado.sucesso) alert(resultado.mensagem);
      navegarPara('sensores');
    });
  });
  container.querySelectorAll('.btn-desconectar').forEach(btn => {
    btn.addEventListener('click', async () => {
      await FloodSensors.desconectarDispositivoReal(btn.dataset.id);
      navegarPara('sensores');
    });
  });
  container.querySelectorAll('.btn-simular').forEach(btn => {
    btn.addEventListener('click', () => FloodSensors.iniciarSimulacao(btn.dataset.id, 'subir'));
  });
  container.querySelectorAll('.btn-parar-sim').forEach(btn => {
    btn.addEventListener('click', () => FloodSensors.pararSimulacao(btn.dataset.id));
  });
  container.querySelectorAll('.btn-remover-sensor').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Remover este sensor?')) { FloodSensors.remover(btn.dataset.id); navegarPara('sensores'); }
    });
  });
}

/* ===================== BOLETINS (CRIAR E BUSCAR) ===================== */

function renderBoletins(container, sessao) {
  const boletins = FloodBoletins.listar();
  const podeCriar = ['admin', 'tecnico'].includes(sessao.role);

  container.innerHTML = `
    <h3 data-i18n="menu_boletins"></h3>
    <div class="row g-4">
      ${podeCriar ? `
      <div class="col-md-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 data-i18n="boletins_criar"></h6>
            <form id="form-boletim">
              <div class="mb-2"><input class="form-control" id="boletim-titulo" placeholder="Título" required/></div>
              <div class="mb-2">
                <select class="form-select" id="boletim-categoria">
                  <option>Informativo</option><option>Alerta</option><option>Aviso Crítico</option>
                </select>
              </div>
              <div class="mb-2"><textarea class="form-control" id="boletim-conteudo" rows="4" placeholder="Conteúdo" required></textarea></div>
              <button class="btn btn-primary w-100" type="submit"><i class="bi bi-send"></i> Publicar Boletim</button>
            </form>
          </div>
        </div>
      </div>` : ''}
      <div class="${podeCriar ? 'col-md-7' : 'col-12'}">
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input class="form-control" id="boletim-pesquisa" data-i18n-placeholder="boletins_pesquisar"/>
        </div>
        <div id="lista-boletins"></div>
      </div>
    </div>
  `;

  function desenharLista(lista) {
    const div = document.getElementById('lista-boletins');
    div.innerHTML = lista.map(b => `
      <div class="card mb-2 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <h6>${b.titulo}</h6>
            <span class="badge text-bg-info">${b.categoria}</span>
          </div>
          <p class="mb-1">${b.conteudo}</p>
          <p class="small text-muted mb-0">${b.autor} · ${new Date(b.data).toLocaleString('pt-PT')}</p>
        </div>
      </div>`).join('') || '<p class="text-muted">Nenhum boletim encontrado.</p>';
  }
  desenharLista(boletins);

  document.getElementById('boletim-pesquisa').addEventListener('input', (e) => {
    desenharLista(FloodBoletins.pesquisar(e.target.value));
  });

  if (podeCriar) {
    document.getElementById('form-boletim').addEventListener('submit', (e) => {
      e.preventDefault();
      FloodBoletins.criar({
        titulo: document.getElementById('boletim-titulo').value,
        categoria: document.getElementById('boletim-categoria').value,
        conteudo: document.getElementById('boletim-conteudo').value,
        autor: sessao.nome
      });
      navegarPara('boletins');
    });
  }
}

/* ===================== CONSULTA PÚBLICA DE ALERTAS (perfil "usuario") ===================== */

function renderConsultaPublica(container, sessao) {
  const boletins = FloodBoletins.listar();
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3><i class="bi bi-megaphone-fill"></i> Consulta Pública de Alertas</h3>
      <button class="btn btn-outline-secondary" id="btn-voltar-menu-consulta">
        <i class="bi bi-arrow-left"></i> <span data-i18n="botao_voltar_menu"></span>
      </button>
    </div>
    <p class="text-muted">Consulte aqui os boletins e alertas emitidos para o bairro Mubungo.</p>
    <div class="input-group mb-3">
      <span class="input-group-text"><i class="bi bi-search"></i></span>
      <input class="form-control" id="consulta-pesquisa" placeholder="Pesquisar boletim ou alerta..."/>
    </div>
    <div id="lista-consulta"></div>
  `;

  // IMPORTANTE: este botão apenas regressa ao menu/painel do sistema.
  // Ele NUNCA termina a sessão do utilizador (correção solicitada).
  document.getElementById('btn-voltar-menu-consulta').addEventListener('click', () => navegarPara('painel'));

  function desenhar(lista) {
    document.getElementById('lista-consulta').innerHTML = lista.map(b => `
      <div class="card mb-2 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <h6>${b.titulo}</h6><span class="badge text-bg-info">${b.categoria}</span>
          </div>
          <p class="mb-1">${b.conteudo}</p>
          <p class="small text-muted mb-0">${new Date(b.data).toLocaleString('pt-PT')}</p>
        </div>
      </div>`).join('') || '<p class="text-muted">Nenhum alerta disponível.</p>';
  }
  desenhar(boletins);
  document.getElementById('consulta-pesquisa').addEventListener('input', (e) => desenhar(FloodBoletins.pesquisar(e.target.value)));
}

/* ===================== RELATÓRIOS (EMITIR E PESQUISAR) ===================== */

function renderRelatorios(container, sessao) {
  const relatorios = FloodRelatorios.listar();

  container.innerHTML = `
    <h3 data-i18n="menu_relatorios"></h3>
    <div class="row g-4">
      <div class="col-md-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 data-i18n="relatorios_emitir"></h6>
            <form id="form-relatorio">
              <div class="mb-2"><input class="form-control" id="relatorio-titulo" placeholder="Título" required/></div>
              <div class="mb-2">
                <select class="form-select" id="relatorio-tipo">
                  <option>Ocorrência</option><option>Manutenção de Sensor</option><option>Pedido de Assistência</option><option>Inspeção Técnica</option>
                </select>
              </div>
              <div class="mb-2"><input class="form-control" id="relatorio-local" placeholder="Localização" value="Bairro Mubungo"/></div>
              <div class="mb-2"><textarea class="form-control" id="relatorio-conteudo" rows="4" placeholder="Descrição detalhada" required></textarea></div>
              <button class="btn btn-primary w-100" type="submit"><i class="bi bi-send"></i> Emitir Relatório</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-7">
        <div class="d-flex gap-2 mb-3">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input class="form-control" id="relatorio-pesquisa" data-i18n-placeholder="relatorios_pesquisar"/>
          </div>
          <select class="form-select" id="relatorio-filtro-status" style="max-width:160px;">
            <option value="todos">Todos</option><option value="Aberto">Aberto</option><option value="Em Análise">Em Análise</option><option value="Resolvido">Resolvido</option>
          </select>
        </div>
        <div id="lista-relatorios"></div>
      </div>
    </div>
  `;

  function desenhar(lista) {
    document.getElementById('lista-relatorios').innerHTML = lista.map(r => `
      <div class="card mb-2 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h6>${r.titulo}</h6>
            <span class="badge text-bg-${r.status === 'Resolvido' ? 'success' : r.status === 'Em Análise' ? 'warning' : 'secondary'}">${r.status}</span>
          </div>
          <p class="mb-1">${r.conteudo}</p>
          <p class="small text-muted mb-2">${r.tipo} · ${r.localizacao} · ${r.autor} · ${new Date(r.data).toLocaleString('pt-PT')}</p>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-primary btn-imprimir-wifi" data-id="${r.id}"><i class="bi bi-wifi"></i> <span data-i18n="relatorios_imprimir_wifi"></span></button>
            <button class="btn btn-sm btn-outline-primary btn-imprimir-bt" data-id="${r.id}"><i class="bi bi-bluetooth"></i> <span data-i18n="relatorios_imprimir_bt"></span></button>
            ${['admin', 'tecnico'].includes(sessao.role) ? `
            <select class="form-select form-select-sm w-auto btn-status" data-id="${r.id}">
              <option ${r.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
              <option ${r.status === 'Em Análise' ? 'selected' : ''}>Em Análise</option>
              <option ${r.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
            </select>` : ''}
          </div>
        </div>
      </div>`).join('') || '<p class="text-muted">Nenhum relatório encontrado.</p>';

    document.querySelectorAll('.btn-imprimir-wifi').forEach(b => b.addEventListener('click', () => {
      const rel = relatorios.find(x => x.id === b.dataset.id);
      FloodRelatorios.imprimirViaWifi(rel);
    }));
    document.querySelectorAll('.btn-imprimir-bt').forEach(b => b.addEventListener('click', async () => {
      const rel = relatorios.find(x => x.id === b.dataset.id);
      const res = await FloodRelatorios.imprimirViaBluetooth(rel);
      if (!res.sucesso) alert(res.mensagem);
    }));
    document.querySelectorAll('.btn-status').forEach(sel => sel.addEventListener('change', (e) => {
      FloodRelatorios.atualizarStatus(sel.dataset.id, e.target.value);
      navegarPara('relatorios');
    }));
    FloodI18n.aplicar();
  }
  desenhar(relatorios);

  const aplicarFiltro = () => {
    const termo = document.getElementById('relatorio-pesquisa').value;
    const status = document.getElementById('relatorio-filtro-status').value;
    desenhar(FloodRelatorios.pesquisar(termo, status));
  };
  document.getElementById('relatorio-pesquisa').addEventListener('input', aplicarFiltro);
  document.getElementById('relatorio-filtro-status').addEventListener('change', aplicarFiltro);

  document.getElementById('form-relatorio').addEventListener('submit', (e) => {
    e.preventDefault();
    FloodRelatorios.emitir({
      titulo: document.getElementById('relatorio-titulo').value,
      tipo: document.getElementById('relatorio-tipo').value,
      localizacao: document.getElementById('relatorio-local').value,
      conteudo: document.getElementById('relatorio-conteudo').value,
      autor: sessao.nome
    });
    navegarPara('relatorios');
  });
}

/* ===================== MAPA DE RISCO ===================== */

function renderMapa(container, sessao) {
  container.innerHTML = `
    <h3 data-i18n="menu_mapa"></h3>
    <p class="text-muted">Localização geográfica dos sensores no bairro Mubungo, província do Bengo.</p>
    <div id="mapa-completo" style="height:520px;border-radius:12px;overflow:hidden;"></div>
    <div class="d-flex gap-3 mt-3 small">
      <span><span class="legenda-cor" style="background:#198754"></span> Normal</span>
      <span><span class="legenda-cor" style="background:#fd7e14"></span> Alerta</span>
      <span><span class="legenda-cor" style="background:#dc3545"></span> Crítico</span>
    </div>
  `;
  setTimeout(() => FloodMap.iniciar('mapa-completo'), 100);
}

/* ===================== MENSAGENS E SUPORTE ===================== */

function renderMensagens(container, sessao) {
  container.innerHTML = `
    <h3 data-i18n="mensagens_titulo"></h3>
    <div class="row g-4">
      <div class="col-md-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 data-i18n="mensagens_registar"></h6>
            <form id="form-mensagem">
              <div class="mb-2"><input class="form-control" id="mensagem-assunto" placeholder="Assunto" required/></div>
              <div class="mb-2"><textarea class="form-control" id="mensagem-texto" rows="4" placeholder="Escreva a sua mensagem..." required></textarea></div>
              <button class="btn btn-primary w-100" type="submit"><i class="bi bi-save"></i> <span data-i18n="mensagens_registar"></span></button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-7">
        <h6>Histórico de Mensagens</h6>
        <div id="lista-mensagens"></div>
      </div>
    </div>
  `;

  function desenhar() {
    const lista = FloodMensagens.listar();
    document.getElementById('lista-mensagens').innerHTML = lista.map(m => `
      <div class="card mb-2 border-0 shadow-sm">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${m.assunto}</h6>
            <p class="mb-1 small">${m.texto}</p>
            <p class="small text-muted mb-0">${m.autor} · ${new Date(m.data).toLocaleString('pt-PT')}</p>
          </div>
          <div>
            ${m.status === 'registada'
              ? `<button class="btn btn-sm btn-primary btn-enviar-msg" data-id="${m.id}"><i class="bi bi-send"></i> <span data-i18n="mensagens_enviar"></span></button>`
              : `<span class="badge text-bg-success">Enviada</span>`}
          </div>
        </div>
      </div>`).join('') || '<p class="text-muted">Nenhuma mensagem registada.</p>';

    document.querySelectorAll('.btn-enviar-msg').forEach(b => b.addEventListener('click', () => {
      FloodMensagens.enviar(b.dataset.id);
      desenhar();
    }));
    FloodI18n.aplicar();
  }
  desenhar();

  document.getElementById('form-mensagem').addEventListener('submit', (e) => {
    e.preventDefault();
    FloodMensagens.registar({
      autor: sessao.nome,
      assunto: document.getElementById('mensagem-assunto').value,
      texto: document.getElementById('mensagem-texto').value
    });
    document.getElementById('form-mensagem').reset();
    desenhar();
  });
}

/* ===================== PERFIL DO UTILIZADOR ===================== */

function renderPerfil(container, sessao) {
  container.innerHTML = `
    <h3 data-i18n="menu_perfil"></h3>
    <div class="card border-0 shadow-sm" style="max-width:520px;">
      <div class="card-body text-center">
        <img src="${sessao.foto || 'assets/icons/avatar-padrao.svg'}" class="rounded-circle mb-3" style="width:120px;height:120px;object-fit:cover;" id="perfil-preview-foto"/>
        <h5>${sessao.nome}</h5>
        <p class="text-muted mb-1">${sessao.email}</p>
        <span class="badge text-bg-secondary mb-3">${_nomeAmigavelRole(sessao.role)}</span>
        <form id="form-perfil-foto">
          <div class="mb-3 text-start">
            <label class="form-label">Atualizar foto de perfil</label>
            <input type="file" class="form-control" id="perfil-nova-foto" accept="image/*"/>
          </div>
          <button class="btn btn-primary w-100" type="submit"><i class="bi bi-upload"></i> Guardar Foto</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-perfil-foto').addEventListener('submit', (e) => {
    e.preventDefault();
    const ficheiro = document.getElementById('perfil-nova-foto').files[0];
    if (!ficheiro) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      FloodUsers.atualizar(sessao.id, { foto: leitor.result });
      // Atualiza também a sessão ativa para refletir a nova foto imediatamente
      const sessaoAtual = FloodAuth.getSessao();
      sessaoAtual.foto = leitor.result;
      sessionStorage.setItem('fa_sessao_ativa', JSON.stringify(sessaoAtual));
      atualizarEcraAtivo();
    };
    leitor.readAsDataURL(ficheiro);
  });
}
