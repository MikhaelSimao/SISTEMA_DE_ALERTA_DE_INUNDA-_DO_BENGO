/**
 * =============================================================
 *  theme.js - MÓDULO DE TEMA (Claro / Escuro)
 * =============================================================
 * Controla a aparência visual do sistema, guardando a
 * preferência do utilizador na base de dados local (config)
 * para que se mantenha entre sessões.
 * =============================================================
 */

const FloodTheme = (() => {

  /** Aplica o tema guardado na configuração ao elemento <html> */
  function aplicar() {
    const cfg = FloodDB._read(FloodDB.TABLES.CONFIG) || {};
    const tema = cfg.tema || 'claro';
    document.documentElement.setAttribute('data-bs-theme', tema === 'escuro' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-tema', tema);

    // Atualiza o(s) ícone(s) do botão de alternância de tema (pode existir mais
    // de uma instância na página: uma no ecrã de login e outra na topbar)
    document.querySelectorAll('.icone-tema').forEach(icone => {
      icone.className = tema === 'escuro' ? 'bi bi-sun-fill icone-tema' : 'bi bi-moon-stars-fill icone-tema';
    });
  }

  /** Alterna entre tema claro e escuro */
  function alternar() {
    const cfg = FloodDB._read(FloodDB.TABLES.CONFIG) || {};
    cfg.tema = (cfg.tema === 'escuro') ? 'claro' : 'escuro';
    FloodDB._write(FloodDB.TABLES.CONFIG, cfg);
    aplicar();
  }

  return { aplicar, alternar };
})();
