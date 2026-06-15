/* GAIA 2.0 — Módulo: Apollo Imagens 2D */
let imgFile2D = null;
window.onImgFileSelect = function(file) {
  imgFile2D = file;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById('imgPreviewImg').src = e.target.result;
    document.getElementById('imgPreviewWrap').style.display = 'block';
    document.getElementById('imgDropZone').style.display    = 'none';
    document.getElementById('btnAnalyse').disabled = false;
  };
  r.readAsDataURL(file);
};
window.clearImgFile = function() {
  imgFile2D = null;
  document.getElementById('imgPreviewWrap').style.display = 'none';
  document.getElementById('imgDropZone').style.display    = '';
  document.getElementById('btnAnalyse').disabled = true;
  document.getElementById('imgFileInput').value  = '';
};
window.clearImgAll = function() {
  clearImgFile();
  document.getElementById('imgQuestion').value = '';
  document.getElementById('imgResultBox').style.display = 'none';
  document.getElementById('imgPanelBody').innerHTML = '<div class="hz-empty">A análise aparece aqui.</div>';
};
window.analyseImage = async function() {
  if (!imgFile2D) return;
  document.getElementById('btnAnalyse').disabled = true;
  document.getElementById('imgSpinner').style.display = 'block';
  setStatus('A analisar…', 'amber');
  try {
    const fd = new FormData();
    fd.append('image',    imgFile2D);
    fd.append('question', document.getElementById('imgQuestion').value || '');
    const r = await fetch('/api/analyse_image', { method:'POST', body:fd });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    _renderImgResult(d);
    setStatus('Concluído', 'green');
  } catch(e) {
    const w = document.getElementById('imgWarnBox');
    w.textContent = 'Erro: ' + e.message; w.classList.add('visible');
    setStatus('Erro', 'red');
  } finally {
    document.getElementById('btnAnalyse').disabled = false;
    document.getElementById('imgSpinner').style.display = 'none';
  }
};
function _renderImgResult(d) {
  const box = document.getElementById('imgResultBox');
  box.innerHTML = parseMarkdown(d.description || d.result || 'Sem resultado');
  box.style.display = 'block';
  const body = document.getElementById('imgPanelBody');
  body.innerHTML = `<div class="hz-section"><div class="hz-section-label" style="font-family:var(--font-mono);font-size:9px;color:var(--hz-text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px">Descrição</div><div style="font-size:12px;line-height:1.65;color:var(--hz-text-dim)">${escHtml(d.description||'')}</div></div>
  ${d.categories?.length?`<div style="margin-top:10px">${d.categories.map(c=>`<span class="hz-badge hz-badge-green" style="margin:2px;display:inline-block">${escHtml(c)}</span>`).join('')}</div>`:''}
  ${d.confidence?`<div style="margin-top:10px;font-family:var(--font-mono);font-size:18px;color:var(--hz-green)">${Math.round(d.confidence*100)}%</div>`:''}`;
}
window.exportImgResult = function() {
  const text = document.getElementById('imgPanelBody').innerText;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text],{type:'text/plain'}));
  a.download = 'analise_imagem.txt'; a.click();
};
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('imgDropZone');
  if (!dz) return;
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
  dz.addEventListener('drop',      e  => { e.preventDefault(); dz.classList.remove('drag-over'); const f=e.dataTransfer.files[0]; if(f)onImgFileSelect(f); });
});
