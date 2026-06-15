// GAIA 1.1 — Lógica principal (Three.js, módulos, chat, image, voice)
// Este ficheiro é gerado a partir de GAIA.html — podes separar módulos futuramente.


import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js";

/* ═══════════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════════ */
const MODULE_COLORS = {
  gaia:    0xb6ff4d,
  image:   0xff4df0,
  voice:   0x00d4ff,
  weather: 0x7cff4d,
  memory:  0xff884d,
};
let activeModuleColor = MODULE_COLORS.gaia;
let currentModule = "gaia";
let gaiaVoiceLock = false;
let pulseStrength = 0;
let treeRoot, moduleUI = [], moduleTarget = new THREE.Vector3();
let treeDirection = new THREE.Vector3();
let currentTitleId = null;
let particlesCore, particlesRing, particlesLeaves;
let particleMaterialRing, particleMaterialLeaves;

/* ═══════════════════════════════════════════════════════
   THREE.JS SCENE
═══════════════════════════════════════════════════════ */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060e08, 0.028);
scene.add(new THREE.AmbientLight(0x2a3a1a, 0.9));

const light = new THREE.PointLight(0xb6ff4d, 3);
light.position.set(0, 15, 5);
scene.add(light);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(0, 15, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x060e08, 1);
renderer.domElement.id = "gaiaCanvas";
renderer.domElement.dataset.mode = "full";
document.getElementById("shell").prepend(renderer.domElement);

/* Resize */
function resizeRenderer() {
  const shell = document.getElementById("shell");
  const W = shell.clientWidth;
  const H = shell.clientHeight;
  renderer.setSize(W, H);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}
resizeRenderer();
window.addEventListener("resize", resizeRenderer);

renderer.domElement.addEventListener("click", e => {
  if (renderer.domElement.dataset.mode === "mini") {
    e.stopPropagation();
    setChatExpanded(false);
  }
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ── Partículas ── */
function makeParticles(count, spread, size, color, ringRadius = 0) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (ringRadius > 0) {
      const a = Math.random() * Math.PI * 2;
      pos[i*3]   = Math.cos(a) * ringRadius + (Math.random()-0.5) * 1.5;
      pos[i*3+1] = (Math.random()-0.5) * 2;
      pos[i*3+2] = Math.sin(a) * ringRadius + (Math.random()-0.5) * 1.5;
    } else {
      pos[i*3]   = (Math.random()-0.5) * spread;
      pos[i*3+1] = Math.random() * 25;
      pos[i*3+2] = (Math.random()-0.5) * spread;
    }
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size, color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return { pts, mat };
}
const ring  = makeParticles(300, 0, 0.10, 0xb6ff4d, 12);
const core  = makeParticles(80,  8, 0.08, 0xb6ff4d);
const leaves= makeParticles(400, 30, 0.07, 0x7cff4d);
particlesRing   = ring.pts;
particlesCore   = core.pts;
particlesLeaves = leaves.pts;
particleMaterialRing   = ring.mat;
particleMaterialLeaves = leaves.mat;

/* Trail */
const MAX_TRAIL = 100;
const trailPos  = new Float32Array(MAX_TRAIL * 3);
const trailLife = new Float32Array(MAX_TRAIL);
const trailGeo  = new THREE.BufferGeometry();
trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
const trailMat  = new THREE.PointsMaterial({ size: 0.25, color: 0xb6ff4d, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
const trailSys  = new THREE.Points(trailGeo, trailMat);
scene.add(trailSys);
let trailIdx = 0;
function addTrailPoint(p) {
  trailPos[trailIdx*3]   = p.x;
  trailPos[trailIdx*3+1] = p.y;
  trailPos[trailIdx*3+2] = p.z;
  trailLife[trailIdx] = 1.0;
  trailIdx = (trailIdx+1) % MAX_TRAIL;
  trailGeo.attributes.position.needsUpdate = true;
}

/* Módulos 3D */
const MOD_DEFS = [
  { name:"gaia",    icon:"🌳", color:0xb6ff4d },
  { name:"voice",   icon:"🎤", color:0x00d4ff },
  { name:"image",   icon:"🖼️", color:0xff4df0 },
  { name:"weather", icon:"🌦️", color:0x7cff4d },
  { name:"memory",  icon:"🧠", color:0xff884d },
];

function createModuleObj(m, i) {
  const angle = (i / MOD_DEFS.length) * Math.PI * 2;
  const r = 18;
  const circle = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 32),
    new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.4 })
  );
  circle.position.set(Math.cos(angle)*r, 6, Math.sin(angle)*r);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.font = "80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(m.icon, 64, 64);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false, depthWrite: false }));
  sprite.scale.set(2.2, 2.2, 2.2);
  sprite.center.set(0.5, 0.7);
  circle.add(sprite);

  circle.userData = { ...m, baseAngle: angle, state: "orbit" };
  moduleUI.push(circle);
  scene.add(circle);
}
MOD_DEFS.forEach(createModuleObj);
activeModuleColor = MODULE_COLORS.gaia;

/* ── Raycaster click nos módulos ── */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener("click", e => {
  if (renderer.domElement.dataset.mode === "mini") return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(moduleUI);
  if (hits.length > 0) {
    activateModule(hits[0].object);
  }
});

/* ── GLB Loader ── */
new GLTFLoader().load(image3DLocation, gltf => {
  treeRoot = gltf.scene;
  scene.add(treeRoot);

  const box = new THREE.Box3().setFromObject(treeRoot);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = 22 / size.y;
  treeRoot.scale.setScalar(scale);
  const box2 = new THREE.Box3().setFromObject(treeRoot);
  treeRoot.position.y -= box2.min.y + 8;

  const finalBox = new THREE.Box3().setFromObject(treeRoot);
  const center = finalBox.getCenter(new THREE.Vector3());
  treeDirection.subVectors(center, camera.position).normalize();
  moduleTarget.set(
    center.x + treeDirection.x * 3,
    finalBox.max.y + 3 + Math.sin(Date.now()*0.002)*0.5,
    center.z + treeDirection.z * 3
  );

  treeRoot.traverse(c => {
    if (!c.isMesh) return;
    c.material = c.material.clone();
  });

  const gaiaObj = moduleUI.find(m => m.userData.name === "gaia");
  if (gaiaObj) {
    gaiaObj.position.copy(moduleTarget);
    gaiaObj.userData.state = "locked";
    currentModule = "gaia";
    activeModuleColor = gaiaObj.userData.color;
    activateModuleUI("gaia");
    fetchTitles();
    speakGAIA("GAIA online");
  }
});

/* ── Animate loop ── */
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const targetColor = new THREE.Color(activeModuleColor);

  if (treeRoot) {
    treeRoot.traverse(c => {
      if (!c.isMesh) return;
      c.material.color.lerp(targetColor, 0.05);
      c.material.emissive?.lerp(targetColor, 0.08);
    });
  }
  if (particleMaterialRing)   particleMaterialRing.color.lerp(targetColor, 0.03);
  if (particleMaterialLeaves) particleMaterialLeaves.color.lerp(targetColor, 0.02);
  if (particlesRing) particlesRing.rotation.y += 0.0015;
  if (particlesCore) particlesCore.rotation.y += 0.0005;

  if (particlesLeaves) {
    const pos = particlesLeaves.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.array[i*3+1] -= 0.03;
      if (pos.array[i*3+1] < 0) pos.array[i*3+1] = 20;
    }
    pos.needsUpdate = true;
  }

  moduleUI.forEach((m, i) => {
    if (m.userData.state === "active" && treeRoot) {
      m.position.lerp(moduleTarget, 0.08);
      if (m.position.distanceTo(moduleTarget) < 0.3) m.userData.state = "locked";
      if (camera) m.lookAt(camera.position);
      m.scale.setScalar(1.4 + Math.sin(Date.now()*0.01)*0.1);
    } else if (m.userData.state === "orbit") {
      const a = Date.now()*0.0002 + i;
      m.position.set(Math.cos(a)*18, 6, Math.sin(a)*18);
      if (camera) m.lookAt(camera.position);
      m.scale.setScalar(1);
    }
  });

  const activeObj = moduleUI.find(m => m.userData.state === "active" || m.userData.state === "locked");
  if (activeObj) {
    addTrailPoint(activeObj.position);
    addTrailPoint(activeObj.position.clone().add(new THREE.Vector3((Math.random()-0.5)*0.2, 0, (Math.random()-0.5)*0.2)));
    trailMat.color.set(activeModuleColor);
    trailMat.opacity = 0.4 + Math.sin(Date.now()*0.005)*0.2;
  }
  for (let i = 0; i < MAX_TRAIL; i++) {
    trailLife[i] *= 0.66;
    if (trailLife[i] < 0.01) trailLife[i] = 0;
  }
  trailGeo.attributes.alpha && (trailGeo.attributes.alpha.needsUpdate = true);

  light.intensity = 2 + pulseStrength * 5;
  renderer.render(scene, camera);
}
animate();

/* ═══════════════════════════════════════════════════════
   MODULE ROUTING
═══════════════════════════════════════════════════════ */
const MODULE_PANELS = {
  gaia:    "moduleGaia",
  image:   "moduleImage",
  voice:   "moduleVoice",
  weather: "moduleWeather",
  memory:  "moduleMemory",
};

function activateModuleUI(name) {
  currentModule = name;
  // Esconde todos os painéis
  Object.values(MODULE_PANELS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("visible");
  });
  // Mostra o painel certo
  const panel = document.getElementById(MODULE_PANELS[name]);
  if (panel) {
    panel.classList.add("visible");
    document.getElementById("content").classList.add("active");
  }
  // Sidebar blocos
  document.getElementById("gaiaSidebarBlock").style.display   = name === "gaia"   ? "block" : "none";
  document.getElementById("memorySidebarBlock").style.display = name === "memory" ? "block" : "none";
  // Canvas info
  document.getElementById("canvasInfo").style.opacity = (name === "gaia") ? "1" : "0";
  // Label topbar
  document.getElementById("activeModuleLabel").textContent = name.toUpperCase();
  // Botões sidebar activos
  document.querySelectorAll(".mod-btn").forEach(b => b.classList.remove("active"));
  const activeBtn = document.getElementById("modBtn-" + name);
  if (activeBtn) activeBtn.classList.add("active");
  // Chat visibility
  updateChatCanvas(name);
}

window.selectModule = function(name) {
  if (currentModule === name) return;
  activeModuleColor = MODULE_COLORS[name] || MODULE_COLORS.gaia;
  // Move o objeto 3D
  moduleUI.forEach(m => { m.userData.state = "orbit"; });
  const obj = moduleUI.find(m => m.userData.name === name);
  if (obj) obj.userData.state = "active";
  activateModuleUI(name);
  speechSynthesis.cancel();
  if (name === "gaia") { fetchTitles(); }
  if (name === "voice") { initVoiceModes(); }
};

function activateModule(obj) {
  window.selectModule(obj.userData.name);
}

function updateChatCanvas(name) {
  // Modo GAIA: canvas visível por baixo do chat
  // Outros modos: canvas fica activo mas o painel cobre
}

/* ═══════════════════════════════════════════════════════
   CHAT — GAIA MODULE
═══════════════════════════════════════════════════════ */
function setChatExpanded(state) {
  document.body.classList.toggle("chatExpanded", state);
  renderer.domElement.dataset.mode = state ? "mini" : "full";
}
document.getElementById("expandChatBtn").onclick = () => {
  setChatExpanded(!document.body.classList.contains("chatExpanded"));
};

window.sendToGAIA = async function() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  const welcome = document.getElementById("chatWelcome");
  if (welcome) welcome.remove();

  appendChatMsg(msg, "user");
  input.value = "";
  input.style.height = "auto";

  try {
    const fd = new FormData();
    fd.append("message", msg);
    fd.append("title_id", currentTitleId);
    const res = await fetch("/api/chat", { method: "POST", body: fd });
    const data = await res.json();
    data.messages?.forEach(m => {
      appendChatMsg(m.gaia.html, "gaia");
      speakGAIA(m.gaia.html);
    });
  } catch(err) {
    appendChatMsg("Erro de ligação ao servidor", "error");
  }
};

function appendChatMsg(text, type) {
  const area = document.getElementById("chatArea");
  const wrap = document.createElement("div");
  wrap.className = "msg-wrap";

  if (type === "user") {
    wrap.innerHTML = `<div class="msg"><div class="msg-user">${escHtml(text)}</div></div>`;
  } else if (type === "gaia") {
    wrap.innerHTML = `<div class="msg msg-gaia">
      <div class="msg-gaia-header">
        <div class="gaia-avatar">🌳</div>
        <div class="gaia-name">GAIA</div>
      </div>
      <div>${text}</div>
      <div class="msg-actions">
        <button class="msg-action-btn" title="Copiar" onclick="this.textContent='✓';navigator.clipboard.writeText(this.closest('.msg').innerText);setTimeout(()=>this.textContent='⧉',1200)">⧉</button>
        <button class="msg-action-btn" title="Positivo">👍</button>
        <button class="msg-action-btn" title="Negativo">👎</button>
      </div>
    </div>`;
  } else {
    wrap.innerHTML = `<div class="msg"><div style="color:#ff7070;font-size:13px">${escHtml(text)}</div></div>`;
  }
  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
}

document.getElementById("chatInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendToGAIA(); }
});

/* Auto-resize textarea */
const chatTA = document.getElementById("chatInput");
chatTA.addEventListener("input", () => {
  chatTA.style.height = "auto";
  chatTA.style.height = Math.min(chatTA.scrollHeight, 160) + "px";
});

/* ── File menu ── */
window.toggleFileMenu = () => {
  const m = document.getElementById("fileMenu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};
window.selectImage = () => {
  document.getElementById("fileMenu").style.display = "none";
  document.getElementById("imgInput").click();
};
window.selectFile = () => {
  document.getElementById("fileMenu").style.display = "none";
  document.getElementById("docInput").click();
};
document.getElementById("imgInput").addEventListener("change", e => handleUpload(e.target.files[0], "image"));
document.getElementById("docInput").addEventListener("change", e => handleUpload(e.target.files[0], "file"));

async function handleUpload(file, typeFile) {
  const welcome = document.getElementById("chatWelcome");
  if (welcome) welcome.remove();
  if (file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    appendChatMsg(`<img src="${url}" style="max-width:200px;border-radius:10px">`, "gaia");
  } else {
    appendChatMsg(`📄 ${file.name}`, "user");
  }
  const fd = new FormData();
  fd.append(typeFile === "file" ? "file" : "image", file);
  fd.append("title_id", currentTitleId);
  const res = await fetch("/api/chat", { method: "POST", body: fd });
  const data = await res.json();
  appendChatMsg(data.response, "gaia");
  speakGAIA(data.response);
}

/* ── Chat titles ── */
async function fetchTitles() {
  try {
    const res  = await fetch("/api/titles");
    const data = await res.json();
    loadChatTitles(data.titles);
  } catch(e) { console.error(e); }
}

function loadChatTitles(titles) {
  if (!titles || !Array.isArray(titles)) return;
  const panel = document.getElementById("gaiaChatsList");
  panel.innerHTML = "";
  titles.forEach(chat => {
    const el = document.createElement("div");
    el.className = "gaia-chat-item";
    el.textContent = chat.title;
    el.dataset.titleId = chat.id;
    el.onclick = e => { e.stopPropagation(); openChat(chat.id); };
    el.oncontextmenu = e => showContextMenu(e, chat.id);
    panel.appendChild(el);
  });
}

async function chatAction(action, opts = {}) {
  try {
    const res = await fetch("/api/titles/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...opts })
    });
    return await res.json();
  } catch(e) { console.error(e); }
}

window.createNewChat = async function() {
  const name = prompt("Nome do novo chat:");
  if (!name) return;
  const data = await chatAction("create", { title: name });
  fetchTitles();
  openChat(data.id);
};
window.renameChat = async function() {
  if (!currentTitleId) return;
  const n = prompt("Novo nome:");
  if (!n) return;
  await chatAction("rename", { id: currentTitleId, title: n });
  fetchTitles();
};
window.deleteChat = async function() {
  if (!currentTitleId) return;
  if (!confirm("Eliminar este chat?")) return;
  await chatAction("delete", { id: currentTitleId });
  fetchTitles();
  document.getElementById("chatArea").innerHTML = "";
};
window.openChat = async function(titleId) {
  currentTitleId = titleId;
  document.querySelectorAll(".gaia-chat-item").forEach(el => el.classList.remove("active"));
  const sel = document.querySelector(`[data-title-id="${titleId}"]`);
  if (sel) sel.classList.add("active");
  const res  = await fetch(`/api/history/${titleId}`);
  const data = await res.json();
  const area = document.getElementById("chatArea");
  area.innerHTML = "";
  if (!data.history?.length) {
    area.innerHTML = `<div class="chat-welcome"><h2>GAIA</h2><p>Sem mensagens anteriores</p></div>`;
    return;
  }
  data.history.forEach(msg => {
    appendChatMsg(msg.user, "user");
    appendChatMsg(msg.gaia, "gaia");
  });
  area.scrollTop = area.scrollHeight;
};

window.showContextMenu = function(e, chatId) {
  e.preventDefault(); e.stopPropagation();
  currentTitleId = chatId;
  const menu = document.getElementById("chatContextMenu");
  menu.style.display = "block";
  menu.style.left = e.pageX + "px";
  menu.style.top  = e.pageY + "px";
};
document.addEventListener("click", () => {
  document.getElementById("chatContextMenu").style.display = "none";
});

/* ═══════════════════════════════════════════════════════
   IMAGE MODULE
═══════════════════════════════════════════════════════ */
let imgCurrentFile = null, imgSessionId = null, imgResult = null;

window.onImgFileSelect = function(file) {
  if (!file) return;
  imgCurrentFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("imgPreviewImg").src = e.target.result;
    document.getElementById("imgPreviewWrap").style.display = "block";
    document.getElementById("imgDropZone").style.display = "none";
    document.getElementById("btnAnalyse").disabled = false;
  };
  reader.readAsDataURL(file);
};

const imgDZ = document.getElementById("imgDropZone");
imgDZ.addEventListener("dragover", e => { e.preventDefault(); imgDZ.classList.add("drag-over"); });
imgDZ.addEventListener("dragleave", () => imgDZ.classList.remove("drag-over"));
imgDZ.addEventListener("drop", e => {
  e.preventDefault(); imgDZ.classList.remove("drag-over");
  const f = e.dataTransfer.files[0];
  if (f?.type.startsWith("image/")) onImgFileSelect(f);
});

window.analyseImage = async function() {
  if (!imgCurrentFile) return;
  imgSessionId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  document.getElementById("btnAnalyse").disabled = true;
  document.getElementById("imgSpinner").style.display = "block";
  setStatus("A analisar...", "amber");
  const fd = new FormData();
  fd.append("file", imgCurrentFile);
  const q = document.getElementById("imgQuestion").value.trim();
  if (q) fd.append("question", q);
  fd.append("session_id", imgSessionId);
  try {
    const r = await fetch("/analyse", { method: "POST", body: fd });
    if (!r.ok) throw new Error("HTTP " + r.status);
    imgResult = await r.json();
    renderImgResult(imgResult);
    setStatus("Análise concluída", "green");
  } catch(e) {
    document.getElementById("imgWarnBox").textContent = e.message;
    document.getElementById("imgWarnBox").classList.add("visible");
    setStatus("Erro", "red");
  } finally {
    document.getElementById("btnAnalyse").disabled = false;
    document.getElementById("imgSpinner").style.display = "none";
  }
};

function renderImgResult(data) {
  const cl = data.classification || {}, an = data.analysis || {}, mt = data.meta || {}, qa = data.quality || {};
  const confClass = mt.confidence_level === "high" ? "hz-badge-green" : mt.confidence_level === "moderate" ? "hz-badge-amber" : "hz-badge-red";
  let html = "";
  if (qa.fallback_used) html += `<div class="hz-warn">${escHtml(qa.fallback_reason || "Análise não disponível.")}</div>`;
  if (!mt.reliable)     html += `<div class="hz-warn">Confiança baixa (${Math.round(mt.confidence*100)}%) — resultados podem ser imprecisos.</div>`;
  html += `<div style="display:flex;align-items:center;gap:7px;margin-bottom:12px;flex-wrap:wrap">
    <span class="hz-badge hz-badge-cat">${escHtml(cl.category||"—")}</span>
    <span class="hz-tag">${escHtml(cl.subcategory||"")}</span>
    <span class="hz-badge ${confClass}">${Math.round(mt.confidence*100)}%</span>
  </div>`;
  if (cl.tags?.length) html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">${cl.tags.map(t=>`<span class="hz-tag">${escHtml(t)}</span>`).join("")}</div>`;
  html += hzSection("Descrição", `<p class="hz-section-text">${escHtml(an.description||"—")}</p>`);
  html += hzSection("Contexto",  `<p class="hz-section-text">${escHtml(an.context||"—")}</p>`);
  if (an.elements?.length)     html += hzSection("Elementos", `<ul class="hz-list">${an.elements.map(e=>`<li>${escHtml(e)}</li>`).join("")}</ul>`);
  if (an.conclusions?.length)  html += hzSection("Conclusões", `<ul class="hz-list">${an.conclusions.map(c=>`<li>${escHtml(c)}</li>`).join("")}</ul>`);
  if (an.uncertainties?.length) html += hzSection("Incertezas", `<ul class="hz-list" style="--marker:'?'">${an.uncertainties.map(u=>`<li>${escHtml(u)}</li>`).join("")}</ul>`);
  html += `<div class="qa-sep"></div>
    <div class="hz-section-label">Fazer pergunta</div>
    <div class="qa-history" id="imgQaHistory"></div>
    <div class="qa-row">
      <input class="qa-field" id="imgQaInput" placeholder="Ex: que objecto é este?" onkeydown="if(event.key==='Enter')sendImgQA()">
      <button class="hz-btn hz-btn-primary" onclick="sendImgQA()" style="padding:7px 12px;font-size:12px">Enviar</button>
    </div>`;
  document.getElementById("imgPanelBody").innerHTML = html;
}

window.sendImgQA = async function() {
  const q = document.getElementById("imgQaInput")?.value.trim();
  if (!q || !imgCurrentFile || !imgSessionId) return;
  const hist = document.getElementById("imgQaHistory");
  hist.innerHTML += `<div class="qa-bubble qa-user">${escHtml(q)}</div>`;
  document.getElementById("imgQaInput").value = "";
  const fd = new FormData();
  fd.append("file", imgCurrentFile); fd.append("question", q); fd.append("session_id", imgSessionId);
  fd.append("analysis_summary", imgResult?.analysis?.description||"");
  try {
    const r = await fetch("/ask", { method:"POST", body:fd });
    const d = await r.json();
    hist.innerHTML += `<div class="qa-bubble qa-ai">${escHtml(d.answer||"—")}</div>`;
  } catch(e) {
    hist.innerHTML += `<div class="qa-bubble qa-ai" style="color:#ff7070">Erro: ${escHtml(e.message)}</div>`;
  }
};

window.clearImgFile = function() {
  imgCurrentFile = null;
  document.getElementById("imgPreviewWrap").style.display = "none";
  document.getElementById("imgDropZone").style.display = "flex";
  document.getElementById("btnAnalyse").disabled = true;
  document.getElementById("imgFileInput").value = "";
};
window.clearImgAll = function() {
  clearImgFile();
  imgResult = null; imgSessionId = null;
  document.getElementById("imgPanelBody").innerHTML = `<div class="hz-empty">A análise aparece aqui.<br>Carrega uma imagem para começar.</div>`;
  document.getElementById("imgQuestion").value = "";
  document.getElementById("imgWarnBox").classList.remove("visible");
  setStatus("Pronto", "green");
};
window.exportImgResult = function() {
  if (!imgResult) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(imgResult,null,2)],{type:"application/json"}));
  a.download = "analise.json"; a.click();
};

function hzSection(label, content) {
  return `<div class="hz-section"><div class="hz-section-label">${label}</div>${content}</div>`;
}

/* ═══════════════════════════════════════════════════════
   VOICE MODULE — Text Corrector
═══════════════════════════════════════════════════════ */
const VOICE_MODES = [
  { id:"formal",    label:"Formal"    },
  { id:"academic",  label:"Académico" },
  { id:"casual",    label:"Casual"    },
  { id:"business",  label:"Negócios"  },
  { id:"creative",  label:"Criativo"  },
];
let currentVoiceMode = "formal";
let voiceCorrectedText = "";

function initVoiceModes() {
  const pills = document.getElementById("modePills");
  if (pills.children.length) return;
  VOICE_MODES.forEach(m => {
    const btn = document.createElement("button");
    btn.className = "mode-pill" + (m.id === currentVoiceMode ? " active" : "");
    btn.textContent = m.label;
    btn.onclick = () => {
      currentVoiceMode = m.id;
      document.querySelectorAll(".mode-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
    pills.appendChild(btn);
  });
}

window.updateCharCount = function() {
  const n = document.getElementById("voiceEditor").value.length;
  document.getElementById("voiceCharCount").textContent = `${n.toLocaleString("pt")} chars`;
};

window.runCorrection = async function() {
  const text = document.getElementById("voiceEditor").value.trim();
  if (!text) return;
  document.getElementById("btnCorrect").disabled = true;
  document.getElementById("voiceSpinner").style.display = "block";
  setStatus("A corrigir...", "amber");
  try {
    const body = { text, mode: currentVoiceMode, translate_to: document.getElementById("translateTo").value || null };
    const r = await fetch("/correct", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    renderVoiceResult(data);
    setStatus("Concluído", "green");
  } catch(e) {
    document.getElementById("voiceFallback").textContent = "Erro: " + e.message;
    document.getElementById("voiceFallback").classList.add("visible");
    setStatus("Erro", "red");
  } finally {
    document.getElementById("btnCorrect").disabled = false;
    document.getElementById("voiceSpinner").style.display = "none";
  }
};

function renderVoiceResult(data) {
  voiceCorrectedText = data.corrected_text || "";
  // Fallback
  const fb = document.getElementById("voiceFallback");
  if (data.fallback_used) { fb.textContent = data.fallback_reason; fb.classList.add("visible"); }
  else fb.classList.remove("visible");
  // Diff
  const rbox = document.getElementById("voiceResultBox");
  if (data.diff_tokens?.length) {
    rbox.innerHTML = data.diff_tokens.map(t => {
      const s = escHtml(t.text);
      if (t.op === "delete") return `<span class="diff-del">${s}</span>`;
      if (t.op === "insert") return `<span class="diff-ins">${s}</span>`;
      return s;
    }).join("") + `<div class="result-actions">
      <button class="hz-btn" style="background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.25);color:var(--hz-blue);padding:5px 12px;font-size:12px" onclick="voiceAcceptAll()">Aceitar tudo</button>
      <button class="hz-btn hz-btn-ghost" style="padding:5px 12px;font-size:12px" onclick="navigator.clipboard.writeText(voiceCorrectedText)">Copiar</button>
    </div>`;
    rbox.classList.add("visible");
  }
  // Tradução
  if (data.translation?.translated_text) {
    const langs = {en:"Inglês",es:"Espanhol",fr:"Francês",de:"Alemão",it:"Italiano",pt:"Português"};
    document.getElementById("voiceTranslation").innerHTML = `<div class="tl-label">Tradução → ${langs[data.translation.target_language]||data.translation.target_language}</div><div class="tl-text">${escHtml(data.translation.translated_text)}</div>`;
    document.getElementById("voiceTranslation").classList.add("visible");
  } else {
    document.getElementById("voiceTranslation").classList.remove("visible");
  }
  // Sugestões
  const sugs = data.suggestions || [];
  document.getElementById("voiceSugBadge").textContent = sugs.length;
  if (!sugs.length) {
    document.getElementById("voiceSugList").innerHTML = `<div class="hz-empty">Sem sugestões —<br>o texto está correcto.</div>`;
    document.getElementById("voiceStatsCard").style.display = "none";
  } else {
    document.getElementById("voiceSugList").innerHTML = sugs.map(s => `
      <div class="sug-item">
        <span class="sug-type-badge sug-${s.type}">${typeLabel(s.type)}</span>
        ${s.is_optional ? '<div class="sug-optional">opcional</div>' : ""}
        <div class="sug-orig">${escHtml(s.original)}</div>
        <div class="sug-new">${escHtml(s.corrected)}</div>
        <div class="sug-why">${escHtml(s.reason)}</div>
        <div class="sug-conf-bar"><div class="sug-conf-fill" style="width:${Math.round(s.confidence*100)}%"></div></div>
      </div>`).join("");
    // Stats
    const conf = Math.round((data.overall_confidence||0)*100);
    const lang = (data.language_detected||"—").toUpperCase();
    document.getElementById("voiceStatsGrid").innerHTML = `
      <div class="stat-cell"><div class="stat-val">${conf}%</div><div class="stat-lbl">Confiança</div></div>
      <div class="stat-cell"><div class="stat-val">${lang}</div><div class="stat-lbl">Idioma</div></div>
      <div class="stat-cell"><div class="stat-val">${data.stats?.accepted||0}</div><div class="stat-lbl">Aceites</div></div>
      <div class="stat-cell"><div class="stat-val">${data.stats?.optional||0}</div><div class="stat-lbl">Opcionais</div></div>`;
    document.getElementById("voiceStatsCard").style.display = "block";
  }
}

window.voiceAcceptAll = function() {
  document.getElementById("voiceEditor").value = voiceCorrectedText;
  updateCharCount();
};
function typeLabel(t) {
  return {grammar:"Gramática",spelling:"Ortografia",style:"Estilo",punctuation:"Pontuação",clarity:"Clareza"}[t]||t;
}

/* ═══════════════════════════════════════════════════════
   SPEECH & VOICE RECORDING
═══════════════════════════════════════════════════════ */
function speakGAIA(text) {
  if (gaiaVoiceLock) return;
  gaiaVoiceLock = true;
  pulseStrength = 1;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-PT";
  const setVoice = () => {
    const voices = speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes("pt") || v.name.toLowerCase().includes("portugu"));
    if (ptVoice) u.voice = ptVoice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  u.onend = () => { pulseStrength = 0; gaiaVoiceLock = false; clearVoiceBars(); };
  voiceBars();
  if (speechSynthesis.getVoices().length === 0) speechSynthesis.onvoiceschanged = setVoice;
  else setVoice();
}

function voiceBars() {
  const box = document.getElementById("voiceViz");
  box.innerHTML = "";
  for (let i = 0; i < 22; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = (10 + Math.random()*50*(pulseStrength||1)) + "px";
    bar.style.opacity = 0.3 + Math.random()*0.7;
    box.appendChild(bar);
  }
  const loop = setInterval(() => {
    if (pulseStrength <= 0) { clearInterval(loop); clearVoiceBars(); return; }
    [...box.children].forEach(b => b.style.height = (10 + Math.random()*50*pulseStrength) + "px");
  }, 120);
}
function clearVoiceBars() { document.getElementById("voiceViz").innerHTML = ""; }

let mediaRecorder, audioChunks = [], audioContext;
window.startRecording = async function() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  appendChatMsg("🎤 A gravar...", "user");
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = async () => {
    try {
      const webmBlob = new Blob(audioChunks, { type:"audio/webm" });
      const arrayBuffer = await webmBlob.arrayBuffer();
      audioContext = new (window.AudioContext||window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBlob = audioBufferToWav(audioBuffer);
      const fd = new FormData();
      fd.append("audio", wavBlob, "voice.wav");
      fd.append("title_id", currentTitleId);
      const res = await fetch("/api/chat", { method:"POST", body:fd });
      const data = await res.json();
      if (data.type === "voice") {
        appendChatMsg(data.response.text, "user");
        appendChatMsg(data.response.reply, "gaia");
        speakGAIA(data.response.reply);
      }
    } catch(err) { appendChatMsg("Erro ao processar áudio", "error"); }
  };
  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 4000);
};

function audioBufferToWav(buffer) {
  const numChan = buffer.numberOfChannels;
  const len = buffer.length * numChan * 2 + 44;
  const ab = new ArrayBuffer(len);
  const view = new DataView(ab);
  let offset = 0;
  const ws = s => { for (let i=0;i<s.length;i++) view.setUint8(offset++, s.charCodeAt(i)); };
  const w16 = v => { view.setUint16(offset, v, true); offset += 2; };
  const w32 = v => { view.setUint32(offset, v, true); offset += 4; };
  ws("RIFF"); w32(len-8); ws("WAVE"); ws("fmt "); w32(16); w16(1); w16(numChan);
  w32(buffer.sampleRate); w32(buffer.sampleRate*numChan*2); w16(numChan*2); w16(16);
  ws("data"); w32(len-offset-4);
  const channels = [];
  for (let i=0;i<numChan;i++) channels.push(buffer.getChannelData(i));
  for (let i=0;i<buffer.length;i++) for (let c=0;c<numChan;c++) {
    let s = Math.max(-1,Math.min(1,channels[c][i]));
    s = s<0 ? s*0x8000 : s*0x7FFF;
    view.setInt16(offset, s, true); offset += 2;
  }
  return new Blob([ab], { type:"audio/wav" });
}

/* ═══════════════════════════════════════════════════════
   RELÓGIO
═══════════════════════════════════════════════════════ */
function startClock() {
  function tick() {
    const now = new Date();
    const t = now.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const d = now.toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit",year:"numeric"});
    const tEl = document.getElementById("clockTime");
    const dEl = document.getElementById("clockDate");
    if (tEl) tEl.textContent = t;
    if (dEl) dEl.textContent = d;
  }
  tick();
  setInterval(tick, 1000);
}
startClock();

/* ═══════════════════════════════════════════════════════
   UTILITÁRIOS
═══════════════════════════════════════════════════════ */
function setStatus(msg, color) {
  document.getElementById("statusText").textContent = msg;
  document.getElementById("statusDot").style.background =
    color === "green" ? "#22c55e" : color === "amber" ? "#f59e0b" : "#ef4444";
  document.getElementById("statusDot").style.boxShadow =
    color === "green" ? "0 0 8px rgba(34,197,94,0.7)" :
    color === "amber" ? "0 0 8px rgba(245,158,11,0.7)" : "0 0 8px rgba(239,68,68,0.7)";
}

function escHtml(s) {
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* Inicialização */
activateModuleUI("gaia");
initVoiceModes();

