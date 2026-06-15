/* ═══════════════════════════════════════════════════
   GAIA 2.0 — Core: Canvas Three.js (fundo animado)
   type="module" — importado no base.html
   ═══════════════════════════════════════════════════ */
import * as THREE from 'three';

const canvas = document.createElement('canvas');
canvas.id = 'gaiaCanvas';
const shell = document.getElementById('shell');
if (shell) shell.insertBefore(canvas, shell.firstChild);

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

// Partículas
const geo = new THREE.BufferGeometry();
const N   = 600;
const pos = new Float32Array(N * 3);
for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 30;
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const particleMat = new THREE.PointsMaterial({ color: 0xb6ff4d, size: 0.06, transparent: true, opacity: 0.5 });
const particles   = new THREE.Points(geo, particleMat);
scene.add(particles);

// Esfera wireframe
const sphereGeo  = new THREE.IcosahedronGeometry(1.2, 2);
const sphereMat  = new THREE.MeshPhongMaterial({ color: 0xb6ff4d, wireframe: true, transparent: true, opacity: 0.15 });
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphereMesh);

scene.add(new THREE.AmbientLight(0x222222));
const dl = new THREE.DirectionalLight(0xb6ff4d, 1);
dl.position.set(5, 5, 5);
scene.add(dl);

const clock = new THREE.Clock();

// Cor activa — actualizada pela navegação de módulos
export let activeColor = 0xb6ff4d;
window._setModuleColor = hex => { activeColor = hex; };

(function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  sphereMesh.rotation.y = t * 0.15;
  sphereMesh.rotation.x = t * 0.08;
  particles.rotation.y  = t * 0.03;
  particleMat.color.setHex(activeColor);
  sphereMat.color.setHex(activeColor);
  renderer.render(scene, camera);
})();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
