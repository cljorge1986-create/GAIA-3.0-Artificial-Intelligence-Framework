/* GAIA 2.0 — Módulo: Apollo/Dionysus Vídeo */
window.loadVideoFile = function(input, module) {
  const file = input.files[0]; if (!file) return;
  const url  = URL.createObjectURL(file);
  const listId = module==='apollo'?'apolloVideoList':'dionysusVideoList';
  const areaId = module==='apollo'?'apolloPlayerArea':'dionysusPlayerArea';
  document.getElementById(listId).innerHTML = `<div class="video-item active"><div class="video-item-name">${escHtml(file.name)}</div><div class="video-item-meta">${(file.size/1024/1024).toFixed(1)} MB</div></div>`;
  document.getElementById(areaId).innerHTML = `<video controls src="${url}" style="max-width:100%;max-height:100%"></video>`;
};
window.analyseVideo = async function(module) {
  const resultsId = module==='apollo'?'apolloVideoResults':null; if(!resultsId)return;
  document.getElementById(resultsId).innerHTML = `<div style="padding:14px;font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A analisar vídeo…</div>`;
  setStatus('A analisar…','amber');
  setTimeout(()=>{document.getElementById(resultsId).innerHTML='<div class="hz-empty">Funcionalidade em desenvolvimento.<br>Endpoint: POST /api/analyse_video</div>';setStatus('Online','green');},1500);
};
window.generateVideo = function() {
  const prompt=document.getElementById('dVideoPrompt').value.trim(); if(!prompt)return;
  document.getElementById('dionysusPlayerArea').innerHTML=`<div style="font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted);text-align:center"><div style="font-size:36px;margin-bottom:12px;animation:spin 2s linear infinite">⟳</div>A gerar vídeo…</div>`;
  setStatus('A gerar…','amber');
  fetch('/api/generate_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,style:document.getElementById('dVideoStyle')?.value,duration:document.getElementById('dVideoDuration')?.value})})
    .then(r=>r.json()).then(d=>{document.getElementById('dionysusPlayerArea').innerHTML=`<div class="hz-empty" style="opacity:1;padding:40px">${escHtml(d.message||'Pendente')}</div>`;setStatus('Online','green');})
    .catch(()=>{setStatus('Erro','red');});
};
