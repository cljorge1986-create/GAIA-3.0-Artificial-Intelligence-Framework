/* GAIA 2.0 — Módulo: Apollo 3D Viewer (ES module) */
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader }    from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

let renderer3D, scene3D, camera3D, controls3D, model3D, wireframeMode=false;

function init() {
  const c = document.getElementById('threeCanvas'); if(!c)return;
  const w=c.parentElement.clientWidth, h=c.parentElement.clientHeight;
  renderer3D = new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});
  renderer3D.setPixelRatio(window.devicePixelRatio);
  renderer3D.setSize(w,h);
  renderer3D.setClearColor(0x000000,0);
  scene3D  = new THREE.Scene();
  camera3D = new THREE.PerspectiveCamera(45,w/h,0.01,1000);
  camera3D.position.set(0,1,3);
  controls3D = new OrbitControls(camera3D,c);
  controls3D.enableDamping=true;
  scene3D.add(new THREE.AmbientLight(0xffffff,0.6));
  const dl=new THREE.DirectionalLight(0xffffff,1.2); dl.position.set(5,10,7); scene3D.add(dl);
  scene3D.add(new THREE.GridHelper(10,20,0x333333,0x222222));
  (function render(){ requestAnimationFrame(render); controls3D.update(); renderer3D.render(scene3D,camera3D); })();
}
document.addEventListener('DOMContentLoaded', init);

window.load3DModel = function(file) {
  if(!file||!renderer3D)return;
  const url=URL.createObjectURL(file);
  document.getElementById('viewer3dEmpty').style.display='none';
  new GLTFLoader().load(url, gltf=>{
    if(model3D)scene3D.remove(model3D);
    model3D=gltf.scene;
    const box=new THREE.Box3().setFromObject(model3D);
    const size=box.getSize(new THREE.Vector3());
    model3D.position.sub(box.getCenter(new THREE.Vector3()));
    const mx=Math.max(size.x,size.y,size.z); if(mx>0)model3D.scale.setScalar(2/mx);
    scene3D.add(model3D); camera3D.position.set(0,1,3); controls3D.reset();
    document.getElementById('model3dInfo').innerHTML=`
      <div style="margin-bottom:10px"><div style="font-family:var(--font-mono);font-size:9px;color:var(--hz-text-muted);text-transform:uppercase;margin-bottom:4px">Ficheiro</div><div style="font-size:12px;color:var(--hz-text-dim)">${escHtml(file.name)}</div></div>
      <div style="margin-bottom:10px"><div style="font-family:var(--font-mono);font-size:9px;color:var(--hz-text-muted);text-transform:uppercase;margin-bottom:4px">Dimensões</div><div style="font-size:12px;color:var(--hz-text-dim)">${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}</div></div>
      <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--hz-text-muted);text-transform:uppercase;margin-bottom:4px">Tamanho</div><div style="font-size:12px;color:var(--hz-text-dim)">${(file.size/1024/1024).toFixed(2)} MB</div></div>`;
  }, undefined, err=>{
    document.getElementById('model3dInfo').innerHTML=`<div class="hz-empty">Erro: ${escHtml(err.message||'desconhecido')}</div>`;
  });
};
window.resetCamera3D   = ()=>controls3D?.reset();
window.toggleWireframe = ()=>{ if(!model3D)return; wireframeMode=!wireframeMode; model3D.traverse(c=>{if(c.isMesh)c.material.wireframe=wireframeMode;}); };
window.resetScene3D    = ()=>{ if(model3D&&scene3D){scene3D.remove(model3D);model3D=null;} document.getElementById('viewer3dEmpty').style.display='flex'; document.getElementById('model3dInfo').innerHTML='<div class="hz-empty">Informações do modelo aparecem aqui.</div>'; };
