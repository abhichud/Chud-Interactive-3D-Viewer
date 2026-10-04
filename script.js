import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Permanent calibrated mesh-to-subsystem mappings for all users
const PERMANENT_OVERRIDES = {
  "bike1.glb": {
    "Object_40_22": "chassis",
    "Object_39_21": "chassis",
    "Object_44_24": "chassis",
    "Object_36_18": "chassis",
    "Object_34_16": "engine",
    "Object_33_15": "chassis",
    "Object_140_105": "chassis",
    "Object_148_110": "transmission",
    "Object_147_109": "chassis",
    "Object_27_10": "transmission",
    "Object_28_11": "wheels",
    "Object_53_30": "engine",
    "Object_149_111": "transmission",
    "Object_55_31": "chassis",
    "Object_104_76": "chassis",
    "Object_59_34": "chassis",
    "Object_58_33": "chassis"
  },
  "bike2.glb": {
    "Object_20_6": "chassis",
    "Object_162_77": "chassis",
    "Object_52_22": "chassis",
    "Object_46_19": "chassis",
    "Object_32_12": "chassis",
    "Object_184_88": "chassis",
    "Object_182_87": "transmission",
    "Object_178_85": "chassis",
    "Object_44_18": "chassis",
    "Object_50_21": "chassis",
    "Object_188_90": "transmission",
    "Object_36_14": "transmission",
    "Object_190_91": "chassis",
    "Object_140_66": "transmission",
    "Object_12_2": "transmission",
    "Object_16_4": "wheels",
    "Object_186_89": "wheels",
    "Object_28_10": "transmission",
    "Object_174_83": "chassis",
    "Object_74_33": "transmission",
    "Object_62_27": "chassis",
    "Object_138_65": "chassis",
    "Object_64_28": "transmission",
    "Object_220_106": "wheels",
    "Object_180_86": "wheels",
    "Object_86_39": "chassis",
    "Object_100_46": "chassis",
    "Object_88_40": "chassis",
    "Object_96_44": "chassis"
  }
};

// 1. Scene, Warm Golden Haze, Camera & High-DPI Renderer
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xd98642, 0.011);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(3.4, 1.4, 3.4);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// 2. OrbitControls (Free Rotate & Zoom)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0.55, 0);
controls.minDistance = 1.5;
controls.maxDistance = 7.5;
controls.maxPolarAngle = Math.PI / 2 - 0.025;

let isCameraAnimating = false;
const targetCamPos = new THREE.Vector3(3.4, 1.4, 3.4);
const targetLookAt = new THREE.Vector3(0, 0.55, 0);

renderer.domElement.addEventListener('pointerdown', () => { isCameraAnimating = false; });
renderer.domElement.addEventListener('wheel', () => { isCameraAnimating = false; }, { passive: true });
renderer.domElement.addEventListener('touchstart', () => { isCameraAnimating = false; }, { passive: true });

// 3. Golden-Hour Physical Desert Sky (Background Only — No Bike Reflections)
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const sunPosition = new THREE.Vector3();
const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 7.5;
skyUniforms['rayleigh'].value = 2.85;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.85;

const phi = THREE.MathUtils.degToRad(90 - 14);
const theta = THREE.MathUtils.degToRad(135);
sunPosition.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sunPosition);

scene.environment = null;

// 4. High-Contrast Direct Lighting Rig + Deep Ground Shadow Catcher
const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0x8a4b22, 1.05); // Lowered ambient fill so shadows stay deep
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffe8c2, 4.2); // Stronger overhead sun for sharper contrast
sunLight.position.copy(sunPosition).multiplyScalar(18);
sunLight.castShadow = true;

sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 35;
const shadowBounds = 2.8;
sunLight.shadow.camera.left = -shadowBounds;
sunLight.shadow.camera.right = shadowBounds;
sunLight.shadow.camera.top = shadowBounds;
sunLight.shadow.camera.bottom = -shadowBounds;
sunLight.shadow.bias = -0.0002;
sunLight.shadow.normalBias = 0.025;
scene.add(sunLight);

// Dedicated dark shadow-catcher overlay right under the motorcycle tyres
const shadowCatcherGeo = new THREE.PlaneGeometry(8, 8);
shadowCatcherGeo.rotateX(-Math.PI / 2);
const shadowCatcherMat = new THREE.ShadowMaterial({
  color: 0x1a0c02,
  opacity: 0.58 // Increase this (e.g. to 0.75) if you want pitch-black shadows
});
const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
shadowCatcher.position.y = 0.003; // Sits hair-thin above the flat sand clearing
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
rimLight.position.set(-5, 4, -4);
scene.add(rimLight);

const frontFill = new THREE.DirectionalLight(0xfff5e6, 1.2);
frontFill.position.set(0, 2.5, 6);
scene.add(frontFill);

// 5. Saturated Sahara Sand Texture
function createRealisticSandMaterial() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');
  const cImg = cCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const waveDistort = Math.sin(u * 2 + Math.cos(v * 2)) * 1.4;
      const windRipple = Math.sin(v * 18 + waveDistort) * 0.5 + 0.5;
      const secondaryRipple = Math.sin(v * 36 - u * 4) * 0.25 + 0.25;
      const grain = (Math.random() - 0.5) * 24;

      const rippleShade = (windRipple * 18) - 9;
      cImg.data[idx]     = Math.min(255, Math.max(0, 228 + rippleShade + grain));
      cImg.data[idx + 1] = Math.min(255, Math.max(0, 138 + rippleShade * 0.8 + grain * 0.7));
      cImg.data[idx + 2] = Math.min(255, Math.max(0, 58  + rippleShade * 0.4 + grain * 0.4));
      cImg.data[idx + 3] = 255;

      const bumpVal = Math.min(255, Math.max(0, (windRipple * 0.65 + secondaryRipple * 0.35) * 215 + grain * 1.4));
      bImg.data[idx] = bImg.data[idx + 1] = bImg.data[idx + 2] = bumpVal;
      bImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.colorSpace = THREE.SRGBColorSpace;
  colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping;
  colorTex.repeat.set(45, 45);
  colorTex.anisotropy = maxAnisotropy;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(45, 45);
  bumpTex.anisotropy = maxAnisotropy;

  return new THREE.MeshStandardMaterial({
    map: colorTex,
    bumpMap: bumpTex,
    bumpScale: 0.04,
    roughness: 0.86,
    metalness: 0.02
  });
}

// 6. Sculpted Ridged Sand Dunes Geometry
const desertGeo = new THREE.PlaneGeometry(180, 180, 220, 220);
desertGeo.rotateX(-Math.PI / 2);

const posAttr = desertGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  const dist = Math.sqrt(x * x + z * z);

  if (dist > 2.2) {
    const blend = Math.min((dist - 2.2) / 5.5, 1);
    const smoothBlend = blend * blend * (3 - 2 * blend);

    const ridge1 = (1.0 - Math.abs(Math.sin(x * 0.075 + z * 0.05 + Math.sin(z * 0.03) * 1.5))) * 1.65;
    const ridge2 = (1.0 - Math.abs(Math.cos(x * 0.04 - z * 0.085))) * 1.1;
    const swell = Math.sin(x * 0.025 + z * 0.025) * 0.8;

    posAttr.setY(i, (ridge1 + ridge2 + swell - 0.5) * smoothBlend);
  }
}
desertGeo.computeVertexNormals();

const desertMat = createRealisticSandMaterial();
const desertGround = new THREE.Mesh(desertGeo, desertMat);
desertGround.receiveShadow = true;
scene.add(desertGround);

// 7. Saturated Red-Ochre Desert Sandstone Rocks
const rockMat = new THREE.MeshStandardMaterial({
  color: 0x9e4f24,
  bumpMap: desertMat.bumpMap,
  bumpScale: 0.08,
  roughness: 0.9
});

const rockLocations = [
  [-4.5, -3.8, 0.45], [5.8, -4.2, 0.6], [-6.2, 3.5, 0.5],
  [4.9, 5.1, 0.35], [-3.4, 5.8, 0.28], [7.5, -1.2, 0.75]
];

rockLocations.forEach(([rx, rz, scale]) => {
  const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
  const rPos = rockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    rPos.setXYZ(
      i,
      rPos.getX(i) * (0.85 + Math.random() * 0.3),
      rPos.getY(i) * (0.55 + Math.random() * 0.25),
      rPos.getZ(i) * (0.85 + Math.random() * 0.3)
    );
  }
  rockGeo.computeVertexNormals();
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(rx, scale * 0.22, rz);
  rock.rotation.y = Math.random() * Math.PI;
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
});

// 8. Floating Golden Dust Particles
const dustCount = 180;
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount * 3; i += 3) {
  dustPositions[i]     = (Math.random() - 0.5) * 14;
  dustPositions[i + 1] = Math.random() * 3.2 + 0.1;
  dustPositions[i + 2] = (Math.random() - 0.5) * 14;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dustMat = new THREE.PointsMaterial({
  color: 0xffd28a,
  size: 0.028,
  transparent: true,
  opacity: 0.6
});
const dustParticles = new THREE.Points(dustGeo, dustMat);
scene.add(dustParticles);

function getFullHierarchyName(obj) {
  let names = [];
  let curr = obj;
  while (curr) {
    if (curr.name) names.push(curr.name.toLowerCase());
    curr = curr.parent;
  }
  return names.join(' ');
}

// 9. High-Definition GLTF Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let currentBike = null;
let meshList = [];
let activePart = 'all';
let currentModelFile = 'bike1.glb';
let currentBikeName = 'BMW S1000RR';

function enhanceMeshQuality(child) {
  if (child.geometry && !child.geometry.attributes.normal) {
    child.geometry.computeVertexNormals();
  }

  child.material = child.material.clone();
  const mat = child.material;

  const isGlass = mat.transparent && mat.opacity < 0.95;
  child.userData.isNaturallyTransparent = isGlass;
  child.userData.baseOpacity = isGlass ? mat.opacity : 1.0;
  mat.transparent = isGlass;
  mat.depthWrite = !isGlass;

  mat.envMap = null;
  mat.envMapIntensity = 0;
  if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.25);
  if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.45);

  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((mapType) => {
    if (mat[mapType]) {
      mat[mapType].anisotropy = maxAnisotropy;
      if (mapType === 'map' || mapType === 'emissiveMap') {
        mat[mapType].colorSpace = THREE.SRGBColorSpace;
      }
      mat[mapType].needsUpdate = true;
    }
  });

  child.castShadow = true;
  child.receiveShadow = false;
  mat.needsUpdate = true;
}

function loadMotorcycle(modelFile, bikeName) {
  currentModelFile = modelFile;
  if (bikeName) currentBikeName = bikeName;

  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');
  statusTitle.textContent = `Loading ${currentBikeName}...`;

  if (currentBike) {
    scene.remove(currentBike);
    meshList = [];
  }

  loader.load(
    `./${modelFile}`,
    (gltf) => {
      currentBike = gltf.scene;

      const rawBox = new THREE.Box3().setFromObject(currentBike);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const maxAxis = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
      currentBike.scale.multiplyScalar(2.6 / maxAxis);

      currentBike.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3().setFromObject(currentBike);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      currentBike.position.x -= scaledCenter.x;
      currentBike.position.z -= scaledCenter.z;
      currentBike.position.y -= scaledBox.min.y;

      currentBike.updateMatrixWorld(true);
      const bikeBox = new THREE.Box3().setFromObject(currentBike);
      const bikeSize = bikeBox.getSize(new THREE.Vector3());
      const bikeCenter = bikeBox.getCenter(new THREE.Vector3());
      const isXLonger = bikeSize.x >= bikeSize.z;

      // Merge baked permanent overrides with any future local tweaks
      const localOverrides = JSON.parse(localStorage.getItem(`overrides_${modelFile}`) || '{}');
      const savedOverrides = { ...(PERMANENT_OVERRIDES[modelFile] || {}), ...localOverrides };

      let meshIndex = 0;
      currentBike.traverse((child) => {
        if (child.isMesh) {
          enhanceMeshQuality(child);

          const meshId = `${child.name}_${meshIndex++}`;
          child.userData.meshId = meshId;

          const fullPathName = getFullHierarchyName(child);
          const mBox = new THREE.Box3().setFromObject(child);
          const mCenter = mBox.getCenter(new THREE.Vector3());

          const lengthPos = isXLonger
            ? (mCenter.x - bikeCenter.x) / (bikeSize.x || 1)
            : (mCenter.z - bikeCenter.z) / (bikeSize.z || 1);
          const heightPos = (mCenter.y - bikeBox.min.y) / (bikeSize.y || 1);

          let category = 'chassis';

          if (/wheel|tire|tyre|rim|spoke|disc|caliper|brake|rotor|hub/.test(fullPathName)) {
            category = 'wheels';
          } else if (/chain|sprocket|gear|clutch|trans|drive|pedal|shifter|swingarm/.test(fullPathName)) {
            category = 'transmission';
          } else if (/engine|motor|cyl|piston|exhaust|muffler|pipe|radiator|manifold|carb|block/.test(fullPathName)) {
            category = 'engine';
          } else if (/frame|chassis|tank|seat|saddle|handle|fork|mirror|headlight|taillight|fender|fairing|body|shock/.test(fullPathName)) {
            category = 'chassis';
          } else {
            if (Math.abs(lengthPos) > 0.25 && heightPos < 0.52) {
              category = 'wheels';
            } else if (Math.abs(lengthPos) <= 0.18 && heightPos >= 0.22 && heightPos <= 0.58) {
              category = 'engine';
            } else if (lengthPos >= -0.28 && lengthPos <= 0.08 && heightPos >= 0.14 && heightPos <= 0.44) {
              category = 'transmission';
            } else {
              category = 'chassis';
            }
          }

          if (savedOverrides[meshId]) {
            category = savedOverrides[meshId];
          }

          child.userData.category = category;
          child.userData.targetOpacity = child.userData.baseOpacity;
          meshList.push(child);
        }
      });

      scene.add(currentBike);
      resetSubsystemView();
    },
    undefined,
    () => {
      statusTitle.textContent = `Missing File: ${modelFile}`;
      statusDesc.textContent = `Place ${modelFile} inside your folder for ${currentBikeName}.`;
    }
  );
}

loadMotorcycle('bike1.glb', 'BMW S1000RR');

// 10. Subsystem Info & Camera Focusing
const subsystemInfo = {
  all: {
    desc: 'Select a subsystem on the left to isolate components (Shift + Click any part to reassign)',
    camPos: [3.4, 1.4, 3.4],
    lookAt: [0, 0.55, 0]
  },
  engine: {
    title: 'Engine & Exhaust Assembly',
    desc: 'Core powertrain isolated • Drag to rotate freely, or Shift + Click parts to customize',
    camPos: [2.0, 0.95, 2.0],
    lookAt: [0, 0.48, 0]
  },
  transmission: {
    title: 'Transmission & Drivetrain',
    desc: 'Gearbox, clutch, and chain drive isolated • Drag to rotate or Shift + Click parts',
    camPos: [-2.1, 0.85, 2.0],
    lookAt: [0, 0.42, 0]
  },
  chassis: {
    title: 'Main Frame & Bodywork',
    desc: 'Structural frame, aerodynamic fairing, and forks • Drag to rotate freely',
    camPos: [2.7, 1.4, 2.7],
    lookAt: [0, 0.65, 0]
  },
  wheels: {
    title: 'Alloy Wheels & Braking',
    desc: 'Front and rear wheel assemblies and disc callipers • Drag to rotate freely',
    camPos: [2.8, 0.8, 2.8],
    lookAt: [0, 0.4, 0]
  }
};

function applyOpacityFilter() {
  meshList.forEach((mesh) => {
    const isSolid = (activePart === 'all' || mesh.userData.category === activePart);
    mesh.userData.targetOpacity = isSolid ? mesh.userData.baseOpacity : 0.12;
    mesh.castShadow = isSolid;
  });

  // Sync each subsystem's progress bar (100% when active/full view, 0% when faded)
  document.querySelectorAll('.dock-card').forEach((card) => {
    const barFill = card.querySelector('.cnd-bar span');
    if (barFill) {
      barFill.style.transition = 'width 0.25s ease';
      const isVisible = (activePart === 'all' || card.dataset.part === activePart);
      barFill.style.width = isVisible ? '100%' : '0%';
    }
  });
}

applyOpacityFilter();

function resetSubsystemView() {
  activePart = 'all';
  document.querySelectorAll('.dock-card').forEach((c) => c.classList.remove('active'));
  document.getElementById('status-title').textContent = `${currentBikeName} — Full View`;
  document.getElementById('status-desc').textContent = subsystemInfo.all.desc;

  targetCamPos.set(...subsystemInfo.all.camPos);
  targetLookAt.set(...subsystemInfo.all.lookAt);
  isCameraAnimating = true;
  applyOpacityFilter();
}

document.querySelectorAll('.dock-card').forEach((card) => {
  card.addEventListener('click', () => {
    const selected = card.dataset.part;
    if (activePart === selected) {
      resetSubsystemView();
      return;
    }

    activePart = selected;
    document.querySelectorAll('.dock-card').forEach((c) => c.classList.remove('active'));
    card.classList.add('active');

    const info = subsystemInfo[selected];
    document.getElementById('status-title').textContent = `${currentBikeName} — ${info.title}`;
    document.getElementById('status-desc').textContent = info.desc;

    targetCamPos.set(...info.camPos);
    targetLookAt.set(...info.lookAt);
    isCameraAnimating = true;
    applyOpacityFilter();
  });
});

// Shift + Click Custom Part Assignment
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
  if (!event.shiftKey || activePart === 'all' || meshList.length === 0) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(meshList, false);
  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    clickedMesh.userData.category = (clickedMesh.userData.category === activePart) ? 'chassis' : activePart;

    const savedOverrides = JSON.parse(localStorage.getItem(`overrides_${currentModelFile}`) || '{}');
    savedOverrides[clickedMesh.userData.meshId] = clickedMesh.userData.category;
    localStorage.setItem(`overrides_${currentModelFile}`, JSON.stringify(savedOverrides));

    applyOpacityFilter();
  }
});

// Multi-Motorcycle Switcher Click Handlers
document.querySelectorAll('.bike-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bike-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    loadMotorcycle(btn.dataset.model, btn.dataset.name);
  });
});

// 11. Right-Side Vertical Zoom Slider Binding
const zoomSlider = document.getElementById('zoom-slider');

function setCameraDistance(dist) {
  isCameraAnimating = false;
  const clamped = Math.max(controls.minDistance, Math.min(controls.maxDistance, dist));
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, clamped);
  zoomSlider.value = clamped;
}

zoomSlider.addEventListener('input', (e) => setCameraDistance(parseFloat(e.target.value)));
document.getElementById('zoom-in').addEventListener('click', () => setCameraDistance(parseFloat(zoomSlider.value) - 0.6));
document.getElementById('zoom-out').addEventListener('click', () => setCameraDistance(parseFloat(zoomSlider.value) + 0.6));

controls.addEventListener('change', () => {
  const currentDist = camera.position.distanceTo(controls.target);
  zoomSlider.value = currentDist.toFixed(1);
});

// 12. Responsive Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 13. Render Loop
function animate() {
  requestAnimationFrame(animate);

  if (isCameraAnimating) {
    camera.position.lerp(targetCamPos, 0.07);
    controls.target.lerp(targetLookAt, 0.07);
    if (camera.position.distanceTo(targetCamPos) < 0.05) {
      isCameraAnimating = false;
    }
  }

  const dPos = dustGeo.attributes.position;
  for (let i = 0; i < dPos.count; i++) {
    let x = dPos.getX(i) + 0.003;
    if (x > 7) x = -7;
    dPos.setX(i, x);
  }
  dPos.needsUpdate = true;

  meshList.forEach((mesh) => {
    const mat = mesh.material;
    mat.opacity += (mesh.userData.targetOpacity - mat.opacity) * 0.16;

    if (!mesh.userData.isNaturallyTransparent) {
      const shouldBeTransparent = mat.opacity < 0.98;
      if (mat.transparent !== shouldBeTransparent) {
        mat.transparent = shouldBeTransparent;
        mat.depthWrite = !shouldBeTransparent;
        mat.needsUpdate = true;
      }
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();