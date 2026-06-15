/* GAIA 2.0 — Módulo: GAIA Chat */
let activeChatId = null;

window.createNewChat = async function() {
  const name = prompt("Nome do novo chat:");
  if (!name) return;
  const data = await chatActionCommands("create", { title: name });
  console.log("Novo Chat:", data);
  selectChat(data.id);

  _renderChatList();
  document.getElementById('chatArea').innerHTML = `<div class="chat-welcome" id="chatWelcome"><h2>GAIA</h2><div class="chat-profile-badge" id="chatProfileBadge">${gSettings.profile}</div><p style="margin-top:12px">${_tagline()}</p></div>`;
};

window.renameChat  = function() { 
  console.log("renameChat clicked");
  if(!activeChatId) return; 
  const n = prompt('Novo nome:');
  if (!n) return;
  // muda imediatamente no ecrã
  const el = document.querySelector(
    `[data-title-id="${activeChatId}"]`
  );
  if (el) {
    el.textContent = n;
  }

  // envia para a BD
  chatActionCommands("rename", { id: activeChatId, title: n }); 
};

window.deleteChat  = function() { 
  if(!activeChatId)return; 
  const id = activeChatId;
  // remove logo da lista visual
  const el = document.querySelector( `[data-title-id="${id}"]` );
  if (el) { el.remove();  }
  activeChatId=null;
  chatActionCommands("delete", { id: id });
  document.getElementById('chatArea').innerHTML=`<div class="chat-welcome"><h2>GAIA</h2><p>Cria uma nova conversa.</p></div>`; 
};

async function chatActionCommands(action, opts = {}) {
  console.log("ACTION:", action, opts);
  try {
    console.log("ACTION:", action, opts);
    const res = await fetch("/api/titles/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...opts })
    });
    //console.log("status:", res.status);
    const data = await res.json();
    //console.log("response:", data);
    return data;
  } catch(e) { console.error(e); }
}

function _tagline() {
  return { WARM:'Olá! Como posso ajudar hoje?', DIRECT:'Diz o que precisas.', STRICT:'Aguardo a sua solicitação.', MECHANICAL:'INPUT REQUIRED.', ANALYTICAL:'Pronto para processar dados.' }[gSettings.profile] || '';
}
/*  // Chat Title or ID */

function _renderChatList() {
  fetchTitles();
}

window.selectChat = function(id) {
  activeChatId = id;
  openChat(id);
};

window.openChat = async function(titleId) {
  activeChatId = titleId;

  document.querySelectorAll(".gaia-chat-item")
    .forEach(el => el.classList.remove("active"));

  const sel = document.querySelector(`[data-title-id="${titleId}"]`);
  if (sel) sel.classList.add("active");

  const res = await fetch(`/api/history/${titleId}`);
  const data = await res.json();

  const area = document.getElementById("chatArea");
  area.innerHTML = "";

  if (!data.history?.length) {
    area.innerHTML = `
      <div class="chat-welcome">
        <h2>GAIA</h2>
        <p>Sem mensagens anteriores</p>
      </div>`;
    return;
  }

  data.history.forEach(msg => {
    if (msg.user) appendChatMsg(msg.user, "user", true);
    if (msg.gaia) appendChatMsg(msg.gaia, "gaia", true);
  });

  area.scrollTop = area.scrollHeight;
};

async function fetchTitles() {
  try {
    const res  = await fetch("/api/titles");
    const data = await res.json();
    //console.log("API titles response:", data);
    loadChatTitles(data.titles);
  } catch(e) { console.error(e); }
}

function loadChatTitles(titles) {
  if (!titles || !Array.isArray(titles)) return;
  const panel = document.getElementById("gaiaChatsList");
  if (!panel) return;
  panel.innerHTML = "";
  titles.forEach(chat => {
    const el = document.createElement("div");

    el.className = `gaia-chat-item ${activeChatId === chat.id ? 'active' : ''}`;
    el.textContent = chat.title;
    el.dataset.titleId = chat.id;
    el.onclick = () => selectChat(chat.id);
    el.oncontextmenu = e => {
      e.preventDefault();
      chatCtxMenu(e, chat.id);
    };
    panel.appendChild(el);
  });
}
window.chatCtxMenu = function(e, id) {
  activeChatId = id; 
  showCtxMenu(e.clientX, e.clientY - 50); 
};

/* end chat title */



window.appendChatMsg = function(text, role) {
  const area = document.getElementById('chatArea');

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap';

  wrap.innerHTML =
    role === 'user'
      ? `<div class="msg msg-user">${escHtml(text)}</div>`
      : `<div class="msg msg-gaia">
          <div>${parseMarkdown(text)}</div>
        </div>`;

  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
};

window.sendToGAIA = async function() {
  const inp  = document.getElementById('chatInput');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = ''; inp.style.height = 'auto';
  if (!activeChatId){ await createNewChat(); }
  selectModule('gaia');
  appendChatMsg(text, 'user');
  setStatus('A pensar…', 'amber');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, profile: gSettings.profile, lang: gSettings.lang, title_id: activeChatId })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const reply = d.response?.reply || d.reply || '…';
    appendChatMsg(reply, 'gaia');
    if (gSettings.thothEnabled) speakGAIA(reply);
    setStatus('Online', 'green');
  } catch(e) {
    appendChatMsg('Erro: ' + e.message, 'error');
    setStatus('Erro', 'red');
  }
};

/* Auto-resize textarea */
document.addEventListener('DOMContentLoaded', () => {
  const ta = document.getElementById('chatInput');
  if (!ta) return;
  ta.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendToGAIA();} });
  ta.addEventListener('input', function() { this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,160)+'px'; });
  fetchTitles();
});

window.toggleFileMenu = function() { const m=document.getElementById('fileMenu'); if(m) m.style.display=m.style.display==='none'?'block':'none'; };
window.selectImage    = function() { document.getElementById('imgInput').click(); hideCtxMenu(); };
window.selectFile     = function() { document.getElementById('docInput').click(); hideCtxMenu(); };


