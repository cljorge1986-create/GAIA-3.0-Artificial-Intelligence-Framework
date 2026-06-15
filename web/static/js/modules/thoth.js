/* GAIA 2.0 — Módulo: Thoth (corrector de texto) */

const THOTH_MODES = [
  { id:'standard',  label:'Padrão'   },
  { id:'formal',    label:'Formal'   },
  { id:'casual',    label:'Casual'   },
  { id:'creative',  label:'Criativo' },
  { id:'technical', label:'Técnico'  },
];
let currenThothMode  = 'standard';
let thothCorrectedText = '';

window.initThothModes = function() {
  const pills = document.getElementById('modePills');
  if (!pills) return;
  pills.innerHTML = THOTH_MODES.map(m =>
    `<button class="mode-pill ${m.id === currenThothMode ? 'active' : ''}"
       onclick="setThothMode('${m.id}', this)">${m.label}</button>`
  ).join('');
};

window.setThothMode = function(mode, el) {
  currenThothMode = mode;
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
};

window.updateCharCount = function() {
  const n = (document.getElementById('thothEditor')?.value || '').length;
  const el = document.getElementById('thothCharCount');
  if (el) el.textContent = n.toLocaleString('pt') + ' chars';
};

window.runCorrection = async function() {
  const text = document.getElementById('thothEditor')?.value.trim();
  if (!text) return;
  const btn = document.getElementById('btnCorrect');
  const spinner = document.getElementById('thothSpinner');
  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'block';
  setStatus('A corrigir…', 'amber');
  try {
    const body = {
      text,
      mode: currenThothMode,
      translate_to: document.getElementById('translateTo')?.value || null,
    };
    const r = await fetch('/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    _renderThothResult(data);
    setStatus('Concluído', 'green');
  } catch(e) {
    const fb = document.getElementById('thothFallback');
    if (fb) { fb.textContent = 'Erro: ' + e.message; fb.classList.add('visible'); }
    setStatus('Erro', 'red');
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }
};

function _renderThothResult(data) {
  thothCorrectedText = data.corrected_text || '';

  /* Fallback banner */
  const fb = document.getElementById('thothFallback');
  if (data.fallback_used) { fb.textContent = data.fallback_reason || ''; fb.classList.add('visible'); }
  else fb.classList.remove('visible');

  /* Diff */
  const rbox = document.getElementById('thothResultBox');
  if (data.diff_tokens?.length) {
    rbox.innerHTML = data.diff_tokens.map(t => {
      const s = escHtml(t.text);
      if (t.op === 'delete') return `<span class="diff-del">${s}</span>`;
      if (t.op === 'insert') return `<span class="diff-ins">${s}</span>`;
      return s;
    }).join('') + `
      <div style="margin-top:10px;display:flex;gap:7px">
        <button class="hz-btn hz-btn-accent" style="padding:5px 12px;font-size:12px"
          onclick="thothAcceptAll()">Aceitar tudo</button>
        <button class="hz-btn hz-btn-ghost" style="padding:5px 12px;font-size:12px"
          onclick="copyToClipboard(thothCorrectedText)">⎘ Copiar</button>
      </div>`;
    rbox.classList.add('visible');
  } else {
    rbox.innerHTML = '';
    rbox.classList.remove('visible');
  }

  /* Tradução */
  const tbox = document.getElementById('thothTranslation');
  if (data.translation?.translated_text) {
    const langs = { en:'Inglês', es:'Espanhol', fr:'Francês', de:'Alemão', it:'Italiano', pt:'Português' };
    tbox.innerHTML = `<div class="tl-label">Tradução → ${langs[data.translation.target_language] || data.translation.target_language}</div>
                      <div class="tl-text">${escHtml(data.translation.translated_text)}</div>`;
    tbox.classList.add('visible');
  } else {
    tbox.classList.remove('visible');
  }

  /* Sugestões */
  const sugs   = data.suggestions || [];
  const badge  = document.getElementById('thothSugBadge');
  const sugList = document.getElementById('thothSugList');
  if (badge) badge.textContent = sugs.length;

  if (!sugs.length) {
    sugList.innerHTML = '<div class="hz-empty">Sem sugestões — o texto está correcto.</div>';
    document.getElementById('thothStatsCard').style.display = 'none';
    return;
  }

  const typeLabel = t => ({ grammar:'Gramática', spelling:'Ortografia', style:'Estilo', punctuation:'Pontuação', clarity:'Clareza' }[t] || t);

  sugList.innerHTML = sugs.map(s => `
    <div class="sug-item">
      <span class="sug-type-badge sug-${s.type}">${typeLabel(s.type)}</span>
      ${s.is_optional ? '<div class="sug-optional">opcional</div>' : ''}
      <div class="sug-orig">${escHtml(s.original)}</div>
      <div class="sug-new">${escHtml(s.corrected)}</div>
      <div class="sug-why">${escHtml(s.reason)}</div>
      <div class="sug-conf-bar">
        <div class="sug-conf-fill" style="width:${Math.round(s.confidence * 100)}%"></div>
      </div>
    </div>`).join('');

  /* Estatísticas */
  const conf = Math.round((data.overall_confidence || 0) * 100);
  const lang = (data.language_detected || '—').toUpperCase();
  document.getElementById('thothStatsGrid').innerHTML = `
    <div class="stat-cell"><div class="stat-val">${conf}%</div><div class="stat-lbl">Confiança</div></div>
    <div class="stat-cell"><div class="stat-val">${lang}</div><div class="stat-lbl">Idioma</div></div>
    <div class="stat-cell"><div class="stat-val">${data.stats?.accepted || 0}</div><div class="stat-lbl">Aceites</div></div>
    <div class="stat-cell"><div class="stat-val">${data.stats?.optional || 0}</div><div class="stat-lbl">Opcionais</div></div>`;
  document.getElementById('thothStatsCard').style.display = 'block';
}

window.thothAcceptAll = function() {
  const ed = document.getElementById('thothEditor');
  if (ed) { ed.value = thothCorrectedText; updateCharCount(); }
};
