/* ═══════════════════════════════════════════════════
   GAIA 2.0 — Core: Navegação entre módulos
   ═══════════════════════════════════════════════════ */
const MODULE_ID_MAP = {
  gaia:'moduleGaia', apollo2d:'moduleApollo2D', apollo3d:'moduleApollo3D', apolloVideo:'moduleApolloVideo',
  dionysus2d:'moduleDionysus2D', dionysus3d:'moduleDionysus3D', dionysusVideo:'moduleDionysusVideo',
  articles:'moduleArticles', books:'moduleBooks', history:'moduleHistory',
  hub:'moduleHub', mails:'moduleMails', code:'moduleCode',
  artemis:'moduleArtemis', thoth:'moduleThoth', memory:'moduleMemory',
};
const MODULE_LABELS = {
  gaia:'GAIA · CHAT', apollo2d:'APOLLO · Imagens 2D', apollo3d:'APOLLO · Imagens 3D', apolloVideo:'APOLLO · Vídeo',
  dionysus2d:'DIONYSUS · Imagens 2D', dionysus3d:'DIONYSUS · Imagens 3D', dionysusVideo:'DIONYSUS · Vídeo',
  articles:'DIONYSUS · Artigos', books:'DIONYSUS · Livros', history:'DIONYSUS · História',
  hub:'DIONYSUS · Hub', mails:'DIONYSUS · Mails', code:'DIONYSUS · Código',
  artemis:'ARTEMIS · APIs', thoth:'Text · Corrector', memory:'MEMORY',
};

function _activatePanel(mod) {
  document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('visible'));
  const panelId = MODULE_ID_MAP[mod];
  const panel = document.getElementById(panelId);
  if (panel) { panel.classList.add('visible'); document.getElementById('content').classList.add('active'); }
  const ci = document.getElementById('canvasInfo');
  if (ci) ci.style.opacity = panel ? '0' : '1';
  const lbl = document.getElementById('activeModuleLabel');
  if (lbl) lbl.textContent = MODULE_LABELS[mod] || mod.toUpperCase();
  document.getElementById('gaiaSidebarBlock').style.display   = mod === 'gaia'   ? 'block' : 'none';
  document.getElementById('memorySidebarBlock').style.display = mod === 'memory' ? 'block' : 'none';
  
}

window.selectModule = function(mod) {
  document.querySelectorAll('.mod-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('modBtn-' + mod);
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.sub-btn, .sub-sub-btn').forEach(b => b.classList.remove('active'));
  _activatePanel(mod);
  fetchTitles();
};

window.selectSubModule = function(sub, parent) {
  document.querySelectorAll('.mod-btn').forEach(b => b.classList.remove('active'));
  const pb = document.getElementById('modBtn-' + parent);
  if (pb) pb.classList.add('active');
  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  const sb = document.getElementById('subBtn-' + sub);
  if (sb) sb.classList.add('active');
  document.querySelectorAll('.sub-sub-btn').forEach(b => b.classList.remove('active'));
  const ssb = document.getElementById('subSubBtn-' + sub);
  if (ssb) ssb.classList.add('active');
  _activatePanel(sub);
};

window.toggleSubmenu = function(name) {
  const menu = document.getElementById('sub-' + name);
  const btn  = document.getElementById('modBtn-' + name);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.sub-menu').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.mod-btn').forEach(b => b.classList.remove('expanded'));
  if (!isOpen) { menu.classList.add('open'); if (btn) btn.classList.add('expanded'); }
};

window.toggleSubSub = function(name) {
  const menu  = document.getElementById('sub-sub-' + name);
  const arrow = document.getElementById('arrow-' + name);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
};

window.activateModuleUI = function(mod) { _activatePanel(mod); };


// Only for Dionysus
function openDionysus() {
  toggleSubmenu('dionysus');
  selectSubModule('hub','dionysus');
}
