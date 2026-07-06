import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scenes = {
  "03": {
    mesh: "../models/interactive/scene03_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene03_viewer_meta.json"
  },
  "05": {
    mesh: "../models/interactive/scene05_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene05_viewer_meta.json"
  },
  "07": {
    mesh: "../models/interactive/scene07_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene07_viewer_meta.json"
  },
  "09": {
    mesh: "../models/interactive/scene09_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene09_viewer_meta.json"
  },
  "10": {
    mesh: "../models/interactive/scene12_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene10_viewer_meta.json"
  },
  "14": {
    mesh: "../models/interactive/scene14_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene14_viewer_meta.json"
  },
  "12": {
    mesh: "../models/interactive/scene10_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene12_viewer_meta.json"
  }
};

const params = new URLSearchParams(window.location.search);
const sceneId = scenes[params.get("scene")] ? params.get("scene") : "03";
const config = scenes[sceneId];
const assetVersion = params.get("v") || "20260705-foreground-only";
const root = document.getElementById("viewer-root");
const status = document.getElementById("viewer-status");
const cleanMode = params.get("mode") === "clean" || root.dataset.viewerMode === "clean";
const useNormalMaterial = params.get("material") === "normal" || (!cleanMode && params.get("material") !== "original");
const showHelpers = !cleanMode && params.get("helpers") !== "0";

let renderer;
let camera;
let controls;
let scene;

function setStatus(message) {
  status.textContent = message;
}

function versionedAsset(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(assetVersion)}`;
}

function size() {
  const width = Math.max(2, root.clientWidth || window.innerWidth || 960);
  const height = Math.max(2, root.clientHeight || window.innerHeight || 540);
  return { width, height };
}

function setupRenderer() {
  const { width, height } = size();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x111820, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  root.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1000);
  camera.up.set(0, 0, 1);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;
}

function setupScene() {
  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 2.4));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x98a68d, 1.8));
  [
    [0xffffff, 2.2, [2.6, -3.2, 4.2]],
    [0xfff2d8, 1.3, [-2.6, 1.8, 3.2]],
    [0xe7fff4, 1.1, [0.4, 3.1, 2.4]]
  ].forEach(([color, intensity, position]) => {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  });
}

function applyDebugMaterial(rootObject) {
  const normalMaterial = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide,
    flatShading: false
  });

  rootObject.traverse((child) => {
    if (!child.isMesh) return;
    child.frustumCulled = false;
    if (useNormalMaterial) {
      child.material = normalMaterial;
    } else {
      const materials = Array.isArray(child.material) ? child.material : [child.material].filter(Boolean);
      materials.forEach((material) => {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      });
    }
  });
}

function fitCameraToBounds(bounds) {
  const center = bounds.getCenter(new THREE.Vector3());
  const sizeVector = bounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z, 0.01);
  const distance = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) * 1.85;
  const direction = new THREE.Vector3(1.55, -2.25, 1.25).normalize();

  camera.near = Math.max(0.0005, distance / 200);
  camera.far = Math.max(1000, distance * 200);
  camera.position.copy(center).add(direction.multiplyScalar(distance));
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = Math.max(0.001, distance * 0.02);
  controls.maxDistance = distance * 20;
  controls.update();
}

function addHelpers(bounds) {
  const center = bounds.getCenter(new THREE.Vector3());
  const sizeVector = bounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z, 0.01);

  const box = new THREE.Box3Helper(bounds, 0xffda67);
  scene.add(box);

  const axes = new THREE.AxesHelper(maxDim * 0.65);
  axes.position.copy(center);
  scene.add(axes);

  const grid = new THREE.GridHelper(maxDim * 2.4, 12, 0x6f8f4e, 0x3e4d45);
  grid.rotation.x = Math.PI / 2;
  grid.position.set(center.x, center.y, bounds.min.z);
  scene.add(grid);
}

function countMeshes(rootObject) {
  let meshCount = 0;
  rootObject.traverse((child) => {
    if (child.isMesh) meshCount += 1;
  });
  return meshCount;
}

async function loadForeground() {
  const metadata = await fetch(versionedAsset(config.meta)).then((response) => response.ok ? response.json() : null).catch(() => null);

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      versionedAsset(config.mesh),
      (gltf) => {
        applyDebugMaterial(gltf.scene);
        scene.add(gltf.scene);
        gltf.scene.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        fitCameraToBounds(bounds);
        if (showHelpers) addHelpers(bounds);

        const meshCount = countMeshes(gltf.scene);
        const min = bounds.min.toArray().map((value) => value.toFixed(3)).join(", ");
        const max = bounds.max.toArray().map((value) => value.toFixed(3)).join(", ");
        console.info("[RoboSnap] foreground-only loaded", {
          scene: sceneId,
          mesh: config.mesh,
          meshCount,
          bounds,
          metadata
        });
        setStatus(cleanMode
          ? `Foreground Scene ${sceneId} loaded`
          : `Foreground Scene ${sceneId} loaded · ${meshCount} meshes · bbox min [${min}] max [${max}]`
        );
        if (cleanMode) {
          window.setTimeout(() => {
            status.hidden = true;
          }, 1400);
        }
        resolve();
      },
      undefined,
      reject
    );
  });
}

function animate() {
  window.requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  if (!renderer || !camera) return;
  const { width, height } = size();
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

async function main() {
  setStatus(`Loading foreground Scene ${sceneId}`);
  setupRenderer();
  setupScene();
  animate();
  window.addEventListener("resize", onResize, { passive: true });

  try {
    await loadForeground();
  } catch (error) {
    console.error(error);
    const message = error?.target?.src || error?.message || "Unknown GLB loading error";
    setStatus(`Foreground Scene ${sceneId} failed to load: ${message}`);
  }
}

main();
