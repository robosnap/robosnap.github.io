import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

const CAMERA_DISTANCE_SCALE = 0.5;
const LIGHT_INTENSITY_SCALE = 1.4;
const VERTICAL_ORBIT_DEGREES = 7;
const HORIZONTAL_ORBIT_DEGREES = 39;
const VERSION = "20260705-scene6-cuplight";

const scenes = {
  "03": {
    splat: "../gaussian/scene03_splats.ply",
    mesh: "../models/interactive/scene03_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene03_viewer_meta.json",
    cameraPosition: [-0.951898, -1.107172, -1.970176],
    cameraLookAt: [-0.168086, -0.183959, 0.895339],
    fov: 0.691111,
    cameraDistanceScale: 0.6,
    foregroundMaterial: {
      metalness: 0,
      roughnessMin: 0.82,
      envMapIntensity: 0.18
    }
  },
  "05": {
    splat: "../gaussian/scene05_splats.ply",
    mesh: "../models/interactive/scene05_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene05_viewer_meta.json",
    cameraPosition: [-0.171849, -2.157857, -3.000342],
    cameraLookAt: [-0.545548, -1.089666, -0.334997],
    fov: 0.691111
  },
  "07": {
    splat: "../gaussian/scene07_splats.ply",
    mesh: "../models/interactive/scene07_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene07_viewer_meta.json",
    cameraPosition: [0.176141, -2.857666, -2.58173],
    cameraLookAt: [-0.651929, -1.543043, 0.179099],
    fov: 0.691111,
    lightIntensityScale: 2.65,
    lightMultiplier: 1.2,
    toneMappingExposure: 1.16,
    foregroundMaterial: {
      metalness: 0,
      roughnessMin: 0.86,
      envMapIntensity: 0.25
    },
    softTargetLights: [
      {
        color: 0xfff3dc,
        intensity: 5.4,
        size: 4.6,
        positionOffset: [0.12, -0.62, 1.8],
        targetOffset: [0, 0, 0.34]
      },
      {
        color: 0xeafff5,
        intensity: 2.1,
        size: 3.8,
        positionOffset: [-0.72, 0.42, 1.32],
        targetOffset: [0, 0, 0.28]
      }
    ]
  },
  "09": {
    splat: "../gaussian/scene09_splats.ply",
    mesh: "../models/interactive/scene09_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene09_viewer_meta.json",
    cameraPosition: [-0.146094, -0.771843, -0.29275],
    cameraLookAt: [-0.204082, 0.179446, 1.170906],
    fov: 1.328092,
    cameraDistanceScale: 0.75,
    cameraRightOffset: 0.08,
    lightIntensityScale: 2.7,
    lightMultiplier: 1,
    toneMappingExposure: 1.16,
    softTargetLights: [
      {
        color: 0xfff3dc,
        intensity: 5.6,
        size: 7.2,
        positionOffset: [0.1, -0.55, 1.72],
        targetOffset: [0, 0, 0.32]
      }
    ]
  },
  "10": {
    splat: "../gaussian/scene10_splats.ply",
    mesh: "../models/interactive/scene12_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene10_viewer_meta.json",
    cameraPosition: [-0.000083, -1.369402, -0.746625],
    cameraLookAt: [-0.064639, -0.685467, 0.891587],
    fov: 1.248046
  },
  "14": {
    splat: "../gaussian/scene14_splats.ply",
    mesh: "../models/interactive/scene14_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene14_viewer_meta.json",
    cameraPosition: [-0.439774, -0.323534, -1.745398],
    cameraLookAt: [-0.628625, 0.03857, 1.276311],
    fov: 0.691111,
    cameraDistanceScale: 0.65
  },
  "12": {
    splat: "../gaussian/scene12_splats.ply",
    mesh: "../models/interactive/scene10_foreground_preview_nodraco.glb",
    meta: "../models/interactive/scene12_viewer_meta.json",
    cameraPosition: [-0.439774, -0.323534, -1.745398],
    cameraLookAt: [-0.628625, 0.03857, 1.276311],
    fov: 0.691111,
    cameraPositionOffset: [0, 0, 0.18],
    cameraDistanceScale: 0.65,
    lightIntensityScale: 2.15,
    lightMultiplier: 2,
    toneMappingExposure: 1.1,
    softTargetLights: [
      {
        color: 0xfff0d6,
        intensity: 5.2,
        size: 3.4,
        targetPosition: [-0.133, -0.556, 0.94],
        positionOffset: [0.28, -0.48, 0.82]
      },
      {
        color: 0xeafff6,
        intensity: 1.9,
        size: 4.6,
        targetPosition: [-0.133, -0.556, 0.92],
        positionOffset: [-0.42, 0.22, 0.62]
      }
    ]
  }
};

const params = new URLSearchParams(window.location.search);
const sceneId = scenes[params.get("scene")] ? params.get("scene") : "03";
const config = scenes[sceneId];
const assetVersion = params.get("v") || VERSION;
const gaussianAssetBase = (params.get("assetBase") || window.ROBOSNAP_GAUSSIAN_BASE || "").replace(/\/$/, "");
const root = document.getElementById("viewer-root");
const status = document.getElementById("viewer-status");

let viewer;

RectAreaLightUniformsLib.init();

function setStatus(message, persistent = false) {
  status.textContent = message;
  status.hidden = false;
  if (!persistent) {
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      status.hidden = true;
    }, 2600);
  }
}

function hideStatus() {
  window.clearTimeout(setStatus.timer);
  status.textContent = "";
  status.hidden = true;
}

function versionedAsset(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(assetVersion)}`;
}

function splatAsset(url) {
  // gaussian-splats-3d infers PLY format from the URL suffix, so keep .ply URLs clean.
  if (gaussianAssetBase && !/^(?:[a-z]+:)?\/\//i.test(url)) {
    return `${gaussianAssetBase}/${url.split("/").pop()}`;
  }
  return url;
}

function cameraSetup(metadata = {}) {
  const cameraPosition = metadata.camera_position || config.cameraPosition;
  const cameraLookAt = metadata.camera_look_at || config.cameraLookAt;
  const target = new THREE.Vector3(...cameraLookAt);
  const basePosition = new THREE.Vector3(...cameraPosition);
  if (config.cameraPositionOffset) {
    basePosition.add(new THREE.Vector3(...config.cameraPositionOffset));
  }
  if (config.cameraRightOffset) {
    const right = new THREE.Vector3()
      .subVectors(target, basePosition)
      .normalize()
      .cross(new THREE.Vector3(0, 0, 1))
      .normalize()
      .multiplyScalar(config.cameraRightOffset);
    target.add(right);
    basePosition.add(right);
  }
  const distanceScale = config.cameraDistanceScale ?? CAMERA_DISTANCE_SCALE;
  const position = target.clone().add(basePosition.sub(target).multiplyScalar(distanceScale));
  return {
    position: position.toArray(),
    lookAt: target.toArray(),
    fov: metadata.fov ?? config.fov
  };
}

function distanceBetween(a, b) {
  const av = new THREE.Vector3(...a);
  const bv = new THREE.Vector3(...b);
  return Math.max(0.001, av.distanceTo(bv));
}

function hybridControls() {
  const candidates = [
    viewer?.controls,
    viewer?.perspectiveControls,
    viewer?.orbitControls,
    viewer?.cameraControls
  ];
  return candidates.find((controls) => controls && typeof controls === "object") || null;
}

function applyControlLimits(initialPosition, initialLookAt) {
  const controls = hybridControls();
  if (!controls) return;

  const initialDistance = distanceBetween(initialPosition, initialLookAt);
  const initialPolar = controls.getPolarAngle?.();
  const initialAzimuth = controls.getAzimuthalAngle?.();

  controls.enablePan = false;
  controls.minDistance = Math.max(0.006, initialDistance * 0.035);
  controls.maxDistance = initialDistance;

  if (Number.isFinite(initialPolar)) {
    controls.minPolarAngle = Math.max(0.01, initialPolar - THREE.MathUtils.degToRad(VERTICAL_ORBIT_DEGREES));
    controls.maxPolarAngle = Math.min(Math.PI - 0.01, initialPolar + THREE.MathUtils.degToRad(VERTICAL_ORBIT_DEGREES));
  }
  if (Number.isFinite(initialAzimuth)) {
    controls.minAzimuthAngle = initialAzimuth - THREE.MathUtils.degToRad(HORIZONTAL_ORBIT_DEGREES);
    controls.maxAzimuthAngle = initialAzimuth + THREE.MathUtils.degToRad(HORIZONTAL_ORBIT_DEGREES);
  }

  controls.update?.();
}

function disableClickFocus() {
  if (!viewer) return;
  viewer.onMouseClick = () => {};
  viewer.checkForFocalPointChange = () => {};
  viewer.transitioningCameraTarget = false;
}

function setupLighting(metadata = {}) {
  const threeScene = viewer.threeScene;
  const renderer = viewer.renderer;
  if (!threeScene) return;

  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = config.toneMappingExposure ?? 1.02;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    threeScene.environment = envTex;
    pmrem.dispose();
  }

  const sceneLightScale = (config.lightIntensityScale ?? LIGHT_INTENSITY_SCALE) * (config.lightMultiplier ?? 1);
  const intensity = (value) => value * sceneLightScale;
  const targetCenter = new THREE.Vector3(...(metadata.bounds_center || config.cameraLookAt));
  threeScene.add(new THREE.AmbientLight(0xfffbf2, intensity(0.36)));
  threeScene.add(new THREE.HemisphereLight(0xfff7e7, 0x94a68d, intensity(0.45)));

  const fallbackLights = [
    [0xfff1d0, 1.05, [2.4, -3.2, 4.2]],
    [0xe7fff4, 0.55, [-2.8, 1.4, 3.6]],
    [0xffffff, 0.45, [0.4, 3.1, 2.4]],
    [0xddeaff, 0.35, [-3.2, -2.4, 1.8]]
  ];
  fallbackLights.forEach(([color, baseIntensity, position]) => {
    const light = new THREE.DirectionalLight(color, baseIntensity * sceneLightScale);
    light.position.set(...position);
    light.target.position.copy(targetCenter);
    threeScene.add(light);
    threeScene.add(light.target);
  });

  (config.softTargetLights || []).forEach((source) => {
    const baseTarget = source.targetPosition
      ? new THREE.Vector3(...source.targetPosition)
      : targetCenter.clone().add(new THREE.Vector3(...(source.targetOffset || [0, 0, 0])));
    const target = baseTarget.clone();
    const position = baseTarget.clone().add(new THREE.Vector3(...(source.positionOffset || [0, -0.5, 1.5])));
    const light = new THREE.RectAreaLight(source.color ?? 0xffffff, source.intensity ?? 3, source.size ?? 3, source.size ?? 3);
    light.position.copy(position);
    light.lookAt(target);
    threeScene.add(light);
  });

  (metadata.lights || []).forEach((source) => {
    const energy = Number(source.energy) || 1;
    const [r = 1, g = 1, b = 1] = source.color || [];
    const color = new THREE.Color(r, g, b);
    let light;

    if (source.type === "AREA") {
      const size = Math.max(0.25, Number(source.size) || 1);
      light = new THREE.RectAreaLight(color, intensity(Math.min(1.0, energy / 140)), size, size);
      light.position.fromArray(source.position);
      light.rotation.set(...source.rotation);
    } else if (source.type === "POINT") {
      light = new THREE.PointLight(color, intensity(Math.min(0.65, energy / 1800)), 0, 2);
      light.position.fromArray(source.position);
    } else {
      light = new THREE.DirectionalLight(color, intensity(Math.min(0.6, energy / 180)));
      light.position.fromArray(source.position);
    }

    threeScene.add(light);
  });
}

function applyObjectOffsets(root) {
  const offsets = config.objectOffsets || {};
  Object.entries(offsets).forEach(([name, offset]) => {
    const object = root.getObjectByName(name);
    if (!object) return;
    object.position.add(new THREE.Vector3(...offset));
    object.updateMatrixWorld(true);
  });
}

function loadForeground() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      versionedAsset(config.mesh),
      (gltf) => {
        let meshCount = 0;
        gltf.scene.traverse((child) => {
          if (!child.isMesh) return;
          meshCount += 1;
          child.frustumCulled = false;
          const materials = Array.isArray(child.material) ? child.material : [child.material].filter(Boolean);
          materials.forEach((material) => {
            material.side = THREE.DoubleSide;
            material.depthTest = true;
            material.depthWrite = true;
            material.toneMapped = true;
            const materialTweaks = config.foregroundMaterial || {};
            if (Number.isFinite(materialTweaks.metalness) && "metalness" in material) {
              material.metalness = materialTweaks.metalness;
              material.metalnessMap = null;
            }
            if (Number.isFinite(materialTweaks.envMapIntensity) && "envMapIntensity" in material) {
              material.envMapIntensity = materialTweaks.envMapIntensity;
            }
            const roughnessMin = materialTweaks.roughnessMin ?? 0.35;
            material.roughness = Math.min(1, Math.max(roughnessMin, material.roughness ?? 0.72));
            material.needsUpdate = true;
          });
        });

        applyObjectOffsets(gltf.scene);
        viewer.threeScene.add(gltf.scene);
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        console.info("[RoboSnap] hybrid foreground loaded", {
          scene: sceneId,
          mesh: config.mesh,
          meshCount,
          bounds: {
            min: bounds.min.toArray(),
            max: bounds.max.toArray()
          }
        });
        resolve(meshCount);
      },
      undefined,
      reject
    );
  });
}

async function main() {
  if (window.location.protocol === "file:") {
    setStatus("Use a local HTTP preview to load 3D assets.", true);
    return;
  }

  hideStatus();
  const metadata = await fetch(versionedAsset(config.meta)).then((response) => response.ok ? response.json() : null).catch(() => null);
  const camera = cameraSetup(metadata || {});

  viewer = new GaussianSplats3D.Viewer({
    rootElement: root,
    cameraUp: [0, 0, 1],
    initialCameraPosition: camera.position,
    initialCameraLookAt: camera.lookAt,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: false,
    sphericalHarmonicsDegree: 1,
    useBuiltInControls: true,
    antialiased: false,
    showLoadingUI: false,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5)
  });
  disableClickFocus();

  try {
    await viewer.addSplatScene(splatAsset(config.splat), {
      format: GaussianSplats3D.SceneFormat.Ply,
      splatAlphaRemovalThreshold: 20,
      progressiveLoad: false,
      showLoadingUI: false
    });
  } catch (error) {
    console.error(error);
    setStatus("3D scene failed to load.", true);
    return;
  }

  viewer.start();
  applyControlLimits(camera.position, camera.lookAt);
  setupLighting(metadata || {});

  try {
    await loadForeground();
    hideStatus();
  } catch (error) {
    console.error(error);
    setStatus("Foreground GLB failed to load.", true);
  }
}

main();
