/* GAIA 2.0 — Módulo: Dionysus (textos, mails, código, imagens) */

/* ── Artigos ── */
window.generateArticle = async function() {
  const area=document.getElementById('articlesContent');
  area.innerHTML=`<div style="padding:14px;font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A gerar artigo…</div>`;
  setStatus('A gerar…','amber');
  try {
    const r=await fetch('/api/generate_article',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:document.getElementById('articlesCategory').value,lang:gSettings.lang,profile:gSettings.profile})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();
    area.innerHTML=`<div class="text-card"><div class="text-card-title">${escHtml(d.title||'')}</div><div class="text-card-meta"><span>${escHtml(d.category||'')}</span><span>${escHtml(d.date||'')}</span><span>${d.words||'--'} palavras</span></div><div class="text-card-body">${parseMarkdown(d.content||'')}</div></div>`;
    setStatus('Concluído','green');
  } catch(e){area.innerHTML=`<div class="hz-empty">Erro: ${escHtml(e.message)}</div>`;setStatus('Erro','red');}
};
window.loadArticles = async function() {
  const area=document.getElementById('articlesContent');
  area.innerHTML=`<div style="padding:14px;font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A carregar…</div>`;
  try{const r=await fetch('/api/articles');const d=await r.json();if(!d.articles?.length){area.innerHTML='<div class="hz-empty">Nenhum artigo encontrado.</div>';return;}area.innerHTML=d.articles.map(a=>`<div class="text-card"><div class="text-card-title">${escHtml(a.title)}</div><div class="text-card-meta"><span>${escHtml(a.category||'')}</span><span>${escHtml(a.date||'')}</span></div><div class="text-card-body">${escHtml(a.summary||'')}</div></div>`).join('');}catch(e){area.innerHTML=`<div class="hz-empty">Erro: ${escHtml(e.message)}</div>`;}
};

/* ── Livros ── */
window.searchBooks = async function() {
  const q=document.getElementById('booksSearch').value.trim(),area=document.getElementById('booksContent');
  if(!q)return;
  area.innerHTML=`<div style="padding:14px;font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A pesquisar…</div>`;
  try{const r=await fetch(`/api/books?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(document.getElementById('booksGenre').value)}`);const d=await r.json();area.innerHTML=(d.books||[]).map(b=>`<div class="text-card"><div class="text-card-title">${escHtml(b.title)}</div><div class="text-card-meta"><span>${escHtml(b.author||'')}</span><span>${escHtml(b.year||'')}</span></div><div class="text-card-body">${escHtml(b.summary||'')}</div></div>`).join('')||'<div class="hz-empty">Sem resultados.</div>';}catch(e){area.innerHTML=`<div class="hz-empty">Erro: ${escHtml(e.message)}</div>`;}
};
window.loadBook = function(file) {
  if(!file)return;
  const area=document.getElementById('booksContent');
  area.innerHTML=`<div style="padding:14px;font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A carregar ${escHtml(file.name)}…</div>`;
  const fd=new FormData();fd.append('file',file);
  fetch('/api/analyse_book',{method:'POST',body:fd}).then(r=>r.json()).then(d=>{area.innerHTML=`<div class="text-card"><div class="text-card-title">${escHtml(d.title||file.name)}</div><div class="text-card-meta"><span>${escHtml(d.author||'')}</span><span>${d.pages||'--'} pág.</span></div><div class="text-card-body">${parseMarkdown(d.summary||'')}</div></div>`;}).catch(e=>{area.innerHTML=`<div class="hz-empty">Erro: ${escHtml(e.message)}</div>`;});
};

/* ── História ── */
window.generateHistory = async function() {
  const era=document.getElementById('historyEra').value,region=document.getElementById('historyRegion').value,area=document.getElementById('historyContent');
  area.innerHTML=`<div style="padding:14px;font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A gerar narrativa…</div>`;
  setStatus('A gerar…','amber');
  try{const r=await fetch('/api/generate_history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({era,region,lang:gSettings.lang})});const d=await r.json();area.innerHTML=`<div class="text-card"><div class="text-card-title">${escHtml(d.title||era+' — '+region)}</div><div class="text-card-meta"><span>${escHtml(era)}</span><span>${escHtml(region)}</span></div><div class="text-card-body">${parseMarkdown(d.content||d.narrative||'')}</div></div>`;setStatus('Concluído','green');}catch(e){area.innerHTML=`<div class="hz-empty">Erro: ${escHtml(e.message)}</div>`;setStatus('Erro','red');}
};

/* ── Mails ── */
window.generateMail = async function() {
  const context=document.getElementById('mailContext').value.trim(); if(!context)return;
  setStatus('A gerar email…','amber');
  try{const r=await fetch('/api/generate_mail',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:document.getElementById('mailTo').value,subject:document.getElementById('mailSubject').value,tone:document.getElementById('mailTone').value,context,lang:gSettings.lang})});const d=await r.json();const out=document.getElementById('mailOutput');out.innerHTML=`<pre style="white-space:pre-wrap;font-family:var(--font-ui);font-size:13px">${escHtml(d.email||'')}</pre><div style="margin-top:10px"><button class="hz-btn hz-btn-ghost" onclick="copyToClipboard(${JSON.stringify(d.email||'')})">⎘ Copiar</button></div>`;out.style.display='block';setStatus('Concluído','green');}catch(e){setStatus('Erro','red');}
};
window.clearMail = function() {
  ['mailTo','mailSubject','mailContext'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('mailOutput').style.display='none';
};
const MAIL_TEMPLATES={meeting:{subject:'Proposta de Reunião',context:'Solicitar marcação de reunião para discutir projecto em andamento.'},followup:{subject:'Follow-up da nossa conversa',context:'Follow-up após reunião anterior, resumindo pontos principais e próximos passos.'},proposal:{subject:'Proposta Comercial',context:'Apresentar proposta comercial com serviços e preços.'},complaint:{subject:'Reclamação Formal',context:'Apresentar reclamação formal sobre produto/serviço com pedido de resolução.'},thanks:{subject:'Obrigado pela colaboração',context:'Agradecer colaboração e parceria.'}};
window.loadMailTemplate=function(type){const t=MAIL_TEMPLATES[type];if(!t)return;document.getElementById('mailSubject').value=t.subject;document.getElementById('mailContext').value=t.context;};

/* ── Imagens 2D (geração) ── */
window.generateImage2D = async function() {
  const prompt=document.getElementById('d2dPrompt').value.trim(); if(!prompt)return;
  const out=document.getElementById('d2dOutput');
  out.innerHTML=`<div style="font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted);text-align:center;padding:40px"><div style="font-size:36px;margin-bottom:12px;animation:spin 2s linear infinite">⟳</div>A gerar imagem…</div>`;
  setStatus('A gerar…','amber');
  try{const r=await fetch('/api/generate_image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,style:document.getElementById('d2dStyle').value,ratio:document.getElementById('d2dRatio').value})});const d=await r.json();if(d.url||d.image_url){out.innerHTML=`<img src="${escHtml(d.url||d.image_url)}" style="max-width:100%;max-height:100%;border-radius:var(--radius-md)">`;const hist=document.getElementById('d2dHistory');hist.innerHTML=`<div class="text-card" style="padding:10px;margin-bottom:8px"><div class="text-card-body" style="font-size:11px">${escHtml(prompt.slice(0,80))}</div><img src="${escHtml(d.url||d.image_url)}" style="width:100%;margin-top:8px;border-radius:8px"></div>`+hist.innerHTML;}else{out.innerHTML='<div class="hz-empty">Sem imagem gerada.</div>';}setStatus('Concluído','green');}catch(e){out.innerHTML=`<div class="hz-empty">Erro: ${escHtml(e.message)}</div>`;setStatus('Erro','red');}
};

/* ── Código ── */
window.runCode = async function() {
  const code=document.getElementById('codeEditor').value.trim(),lang=document.getElementById('codeLang').value,out=document.getElementById('codeOutput');
  if(!code)return;
  out.innerHTML=`<div style="font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A executar ${lang}…</div>`;
  try{const r=await fetch('/api/run_code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,language:lang.toLowerCase()})});const d=await r.json();out.innerHTML=`<pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:12px;color:${d.error?'#ff7070':'var(--hz-text)'}">${escHtml(d.output||'Sem output')}</pre>`;}catch(e){out.innerHTML=`<pre style="color:#ff7070;font-family:var(--font-mono);font-size:12px">Erro: ${escHtml(e.message)}</pre>`;}
};
window.explainCode = async function() {
  const code=document.getElementById('codeEditor').value.trim(); if(!code)return;
  const out=document.getElementById('codeOutput');
  out.innerHTML=`<div style="font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A explicar…</div>`;
  try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Explica este código ${document.getElementById('codeLang').value}:\n\`\`\`\n${code}\n\`\`\``,profile:gSettings.profile})});const d=await r.json();out.innerHTML=`<div style="font-size:13px;line-height:1.7;color:var(--hz-text-dim)">${parseMarkdown(d.response?.reply||d.reply||'')}</div>`;}catch(e){out.innerHTML=`<div style="color:#ff7070;font-size:12px">Erro: ${escHtml(e.message)}</div>`;}
};
window.optimizeCode = async function() {
  const code=document.getElementById('codeEditor').value.trim(); if(!code)return;
  const out=document.getElementById('codeOutput');
  out.innerHTML=`<div style="font-family:var(--font-mono);font-size:12px;color:var(--hz-text-muted)">A optimizar…</div>`;
  try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Optimiza este código ${document.getElementById('codeLang').value}:\n\`\`\`\n${code}\n\`\`\``,profile:gSettings.profile})});const d=await r.json();out.innerHTML=`<div style="font-size:13px;line-height:1.7">${parseMarkdown(d.response?.reply||d.reply||'')}</div>`;}catch(e){out.innerHTML=`<div style="color:#ff7070;font-size:12px">Erro: ${escHtml(e.message)}</div>`;}
};
window.clearCode = function() {
  document.getElementById('codeEditor').value='';
  document.getElementById('codeOutput').innerHTML='<div class="hz-empty">Output limpo.</div>';
};
