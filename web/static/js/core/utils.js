window.escHtml=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
window.parseMarkdown=function(text){
  if(!text)return'';
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g,(_,l,c)=>`<pre><code class="lang-${l}">${c.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^### (.*)/gm,"<h3 style='color:var(--hz-green);margin:8px 0 4px'>$1</h3>")
    .replace(/^## (.*)/gm,"<h2 style='color:var(--hz-green);margin:10px 0 5px'>$1</h2>")
    .replace(/^# (.*)/gm,"<h1 style='color:var(--hz-green);margin:12px 0 6px'>$1</h1>")
    .replace(/^- (.*)/gm,"<li style='margin-left:16px'>$1</li>").replace(/\n/g,'<br>');
};
window.setStatus=function(msg,color){
  const t=document.getElementById('statusText'),d=document.getElementById('statusDot');
  if(t)t.textContent=msg;
  if(d){const m={green:['#22c55e','rgba(34,197,94,0.7)'],amber:['#f59e0b','rgba(245,158,11,0.7)'],red:['#ef4444','rgba(239,68,68,0.7)']};const[bg,glow]=m[color]||m.green;d.style.background=bg;d.style.boxShadow=`0 0 8px ${glow}`;}
};
window.copyToClipboard=text=>navigator.clipboard.writeText(text).catch(()=>{});
window.showCtxMenu=function(x,y){const m=document.getElementById('chatContextMenu');if(!m)return;m.style.display='block';m.style.left=x+'px';m.style.top=y+'px';};
window.hideCtxMenu=function(){const m=document.getElementById('chatContextMenu');if(m)m.style.display='none';};
document.addEventListener('click',hideCtxMenu);
