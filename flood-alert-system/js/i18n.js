/**
 * =============================================================
 *  i18n.js - MÓDULO DE TRADUÇÃO (Português / Kimbundo)
 * =============================================================
 * Permite trocar o idioma de toda a interface do sistema.
 * Os textos são identificados por uma "chave" (data-i18n) em
 * cada elemento HTML, e este módulo substitui o conteúdo pelo
 * texto correspondente ao idioma escolhido.
 *
 * NOTA: as traduções para Kimbundo aqui apresentadas são um
 * léxico de referência geral, incluído para fins demonstrativos
 * e educativos do sistema; para um uso oficial recomenda-se
 * validação com um linguista/falante nativo da língua.
 * =============================================================
 */

const FloodI18n = (() => {

  const dicionario = {
    pt: {
      app_titulo: 'Sistema de Alerta de Inundação - Bairro Mubungo, Bengo',
      menu_painel: 'Painel Inicial',
      menu_usuarios: 'Gerir Usuários',
      menu_sensores: 'Configurar Sensores',
      menu_boletins: 'Boletins',
      menu_relatorios: 'Relatórios',
      menu_mapa: 'Mapa de Risco',
      menu_mensagens: 'Mensagens e Suporte',
      menu_perfil: 'Meu Perfil',
      menu_sair: 'Terminar Sessão',
      login_titulo: 'Iniciar Sessão',
      login_email: 'E-mail',
      login_senha: 'Senha',
      login_entrar: 'Entrar',
      login_criar_conta: 'Criar nova conta',
      login_esqueci: 'Esqueci-me da senha',
      registo_titulo: 'Criar Conta',
      registo_nome: 'Nome completo',
      registo_confirmar_senha: 'Confirmar senha',
      registo_telefone: 'Telefone',
      registo_pergunta: 'Pergunta de segurança',
      registo_resposta: 'Resposta de segurança',
      registo_foto: 'Foto de perfil',
      registo_criar: 'Criar conta',
      registo_voltar: 'Voltar ao início de sessão',
      recuperar_titulo: 'Recuperar Senha',
      recuperar_procurar: 'Procurar conta',
      recuperar_nova_senha: 'Nova senha',
      recuperar_confirmar: 'Confirmar nova senha',
      recuperar_redefinir: 'Redefinir senha',
      dashboard_nivel_agua: 'Nível de Água Atual',
      dashboard_estado: 'Estado',
      dashboard_normal: 'Normal',
      dashboard_alerta: 'Alerta',
      dashboard_critico: 'Crítico',
      dashboard_sensores_ativos: 'Sensores Ativos',
      dashboard_ultimos_boletins: 'Últimos Boletins',
      sensores_titulo: 'Configuração de Sensores',
      sensores_conectar_real: 'Conectar dispositivo real (USB)',
      sensores_modo_simulacao: 'Modo Simulação',
      sensores_desconectar: 'Desconectar',
      sensores_novo: 'Novo Sensor',
      boletins_criar: 'Criar Boletim',
      boletins_pesquisar: 'Pesquisar Boletim',
      relatorios_emitir: 'Emitir Relatório',
      relatorios_pesquisar: 'Pesquisar Relatórios',
      relatorios_imprimir: 'Imprimir',
      relatorios_imprimir_wifi: 'Imprimir via Wi-Fi',
      relatorios_imprimir_bt: 'Imprimir via Bluetooth',
      mensagens_titulo: 'Mensagens e Suporte',
      mensagens_registar: 'Registar mensagem',
      mensagens_enviar: 'Enviar mensagem',
      botao_voltar_menu: 'Voltar ao Menu',
      tema_claro: 'Tema Claro',
      tema_escuro: 'Tema Escuro',
      idioma_label: 'Idioma'
    },
    kmb: {
      app_titulo: 'Kusanga kwa Kubidika kwa Menya - Muxima wa Mubungo, Bengo',
      menu_painel: 'Painéu ya Kubanga',
      menu_usuarios: 'Kutumina Athu',
      menu_sensores: 'Kutumina Ma-Sensor',
      menu_boletins: 'Milaka',
      menu_relatorios: 'Ma-Relatóriu',
      menu_mapa: 'Mapa ya Kizua',
      menu_mensagens: 'Milaka ni Kikwatekesu',
      menu_perfil: 'Perfiu Diami',
      menu_sair: 'Kutunda',
      login_titulo: 'Kwiza mu Sistema',
      login_email: 'E-mail',
      login_senha: 'Mukanda wa Sekelu',
      login_entrar: 'Kwiza',
      login_criar_conta: 'Kubanga Konta Yize',
      login_esqueci: 'Ngi vulama Mukanda wa Sekelu',
      registo_titulo: 'Kubanga Konta',
      registo_nome: 'Dina Dima',
      registo_confirmar_senha: 'Sikula Mukanda wa Sekelu',
      registo_telefone: 'Ntungu',
      registo_pergunta: 'Kiuvu kya Kalunga',
      registo_resposta: 'Kutakula kwa Kiuvu',
      registo_foto: 'Fotu ya Perfiu',
      registo_criar: 'Kubanga Konta',
      registo_voltar: 'Vutuka ku Kwiza mu Sistema',
      recuperar_titulo: 'Kuvutula Mukanda wa Sekelu',
      recuperar_procurar: 'Sota Konta',
      recuperar_nova_senha: 'Mukanda wa Sekelu wa Uze',
      recuperar_confirmar: 'Sikula Mukanda wa Sekelu wa Uze',
      recuperar_redefinir: 'Bidika Mukanda wa Sekelu',
      dashboard_nivel_agua: 'Muzangu wa Menya wa Lelu',
      dashboard_estado: 'Kizua',
      dashboard_normal: 'Kiawiza',
      dashboard_alerta: 'Kubidika',
      dashboard_critico: 'Kizua kya Kubalumuka',
      dashboard_sensores_ativos: 'Ma-Sensor Ena mu Mudimu',
      dashboard_ultimos_boletins: 'Milaka ya Kusuka',
      sensores_titulo: 'Kutumina Ma-Sensor',
      sensores_conectar_real: 'Kukanga Dizuvu dya Kyeleka (USB)',
      sensores_modo_simulacao: 'Mudu wa Kifwani',
      sensores_desconectar: 'Kukatuka',
      sensores_novo: 'Sensor Yize',
      boletins_criar: 'Kubanga Milaka',
      boletins_pesquisar: 'Sota Milaka',
      relatorios_emitir: 'Kutuma Relatóriu',
      relatorios_pesquisar: 'Sota Ma-Relatóriu',
      relatorios_imprimir: 'Simba',
      relatorios_imprimir_wifi: 'Simba ni Wi-Fi',
      relatorios_imprimir_bt: 'Simba ni Bluetooth',
      mensagens_titulo: 'Milaka ni Kikwatekesu',
      mensagens_registar: 'Sonesa Muvu',
      mensagens_enviar: 'Tuma Muvu',
      botao_voltar_menu: 'Vutuka ku Menu',
      tema_claro: 'Kutena kwa Kimoxi',
      tema_escuro: 'Kutena kwa Kifinda',
      idioma_label: 'Dimi'
    }
  };

  /** Devolve o idioma atualmente selecionado (guardado na config) */
  function idiomaAtual() {
    const cfg = FloodDB._read(FloodDB.TABLES.CONFIG);
    return (cfg && cfg.idioma) || 'pt';
  }

  /** Traduz uma chave para o idioma atual (ou pt como reserva) */
  function t(chave) {
    const idioma = idiomaAtual();
    return (dicionario[idioma] && dicionario[idioma][chave]) || dicionario.pt[chave] || chave;
  }

  /** Aplica a tradução a todos os elementos com atributo data-i18n na página */
  function aplicar() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const chave = el.getAttribute('data-i18n');
      el.textContent = t(chave);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const chave = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(chave));
    });
    document.documentElement.lang = idiomaAtual() === 'kmb' ? 'kmb' : 'pt';

    // Sincroniza todos os seletores de idioma existentes na página
    // (existe uma instância no ecrã de autenticação e outra na topbar da app)
    document.querySelectorAll('.seletor-idioma').forEach(sel => {
      sel.value = idiomaAtual();
    });
  }

  /** Muda o idioma do sistema e reaplica as traduções */
  function mudarIdioma(novoIdioma) {
    const cfgObj = FloodDB._read(FloodDB.TABLES.CONFIG) || {};
    cfgObj.idioma = novoIdioma;
    FloodDB._write(FloodDB.TABLES.CONFIG, cfgObj);
    aplicar();
  }

  return { t, aplicar, mudarIdioma, idiomaAtual };
})();
