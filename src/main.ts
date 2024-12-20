import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import RenderPixelatedPass from './RenderPixelatedPass.ts';
import PixelatePass from './PixelatePass';

import * as MAT from './materials.ts';
import { Sky } from './sky';

let camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer;
let controls: OrbitControls;
let gui: GUI;

const animationParams = {
  speed: 1.5,
  strength: 0.5,
  enabled: true,
};

init();
animate();

function init() {
  // GUI
  gui = new GUI();

  let screenResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  );

  let shaderOptions = { pixelSize: 4 };

  let renderResolution = screenResolution
    .clone()
    .divideScalar(shaderOptions.pixelSize);

  renderResolution.x |= 0;
  renderResolution.y |= 0;

  let aspectRatio = screenResolution.x / screenResolution.y;

  camera = new THREE.OrthographicCamera(
    -aspectRatio,
    aspectRatio,
    1,
    -1,
    0.01,
    1100
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x151729);
  // scene.background = new THREE.Color( 0xffffff )

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.setSize(screenResolution.x, screenResolution.y);
  document.body.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);
  let pixelRenderPass = new RenderPixelatedPass(
    4,
    renderResolution,
    scene,
    camera
  );
  composer.addPass(pixelRenderPass);

  let shaderFolder = gui.addFolder('Pixel Shader');
  shaderFolder
    .add(shaderOptions, 'pixelSize', 1, 10, 1)
    .onChange((value: number) => {
      pixelRenderPass.setPixelSize(value);
    });

  // composer.addPass(new RenderPixelatedPass(renderResolution, scene, camera));
  let bloomPass = new UnrealBloomPass(screenResolution, 0.4, 0.1, 0.9);
  composer.addPass(bloomPass);
  composer.addPass(new PixelatePass(renderResolution));

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  camera.position.z = 1.4;
  camera.position.y = 1.1;
  camera.position.x = 1.6;

  camera.rotation.x = -0.36;
  camera.rotation.y = 0.92;
  camera.rotation.z = 0.29;

  controls.update();

  // Add sky before other lights
  const sky = new Sky();
  sky.setTime('12:00');

  const skyFolder = gui.addFolder('Sky');
  skyFolder.add({ time: 12 }, 'time', 0, 24).onChange((value: number) => {
    sky.setTime(value);
  });
  skyFolder
    .add({ rotation: 45 }, 'rotation', 0, 360)
    .onChange((value: number) => {
      sky.setRotation(value);
    });

  sky.addToScene(scene);

  // Animation
  {
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(animationParams, 'enabled');
    animationFolder.add(animationParams, 'speed', 0.1, 5);
    animationFolder.add(animationParams, 'strength', 0, 1);
  }
  // Geometry
  {
    function assignMaterial(
      mesh: THREE.Mesh,
      name: string,
      windowsFolder: GUI
    ) {
      const nameLower = name.toLowerCase();

      // Try to find the most specific matching material first
      const materialKey = Object.keys(MAT.materialMappings).find((key) => {
        const parts = key.split('-');
        return parts.every((part) => nameLower.includes(part));
      });

      if (!materialKey) {
        mesh.material = MAT.errorMat;
        return;
      }

      const config = MAT.materialMappings[materialKey];
      mesh.material =
        typeof config.material === 'function'
          ? config.material()
          : config.material;

      if (config.addToGUI && 'on' in mesh.material) {
        windowsFolder.add(mesh.material, 'on');
      }
    }

    function setupBone(bone: THREE.Bone) {
      const nameLower = bone.name.toLowerCase();
      if (!nameLower.includes('shoulder') && !nameLower.includes('neutral')) {
        bone.userData.seed = Math.random() * 1000;
        bone.userData.initialX = bone.rotation.x;
        bone.userData.initialZ = bone.rotation.z;
      }
    }

    let meshFolder = gui.addFolder('Mesh');
    let windowsFolder = meshFolder.addFolder('Windows');

    const loader = new GLTFLoader();

    const modelScale = 0.15;

    loader.load('/models/model.gltf', (gltf) => {
      gltf.scene.scale.set(modelScale, modelScale, modelScale);

      const streetlightsFolder = gui.addFolder('Streetlights');

      gltf.scene.traverse((child) => {
        child.receiveShadow = true;
        child.castShadow = true;

        if (child instanceof THREE.Mesh) {
          child.receiveShadow = true;
          child.castShadow = true;
          assignMaterial(child, child.name, windowsFolder);
        } else if (child instanceof THREE.Bone) {
          setupBone(child);
        } else {
          if (child.name.toLowerCase().includes('streetlight')) {
            const streetSpotLight = new THREE.SpotLight(
              0xff8800, // warm color
              0.5, // increased intensity
              10, // increased distance
              Math.PI / 4, // wider angle
              0.75, // penumbra
              2
            );

            // Scale position to match model scale
            const scaledPosition = child.position.multiplyScalar(modelScale);
            streetSpotLight.position.copy(scaledPosition);

            // Set up target
            const target = new THREE.Object3D();
            target.position.set(
              scaledPosition.x,
              0, // target at ground level
              scaledPosition.z
            );
            scene.add(target);
            streetSpotLight.target = target;

            streetSpotLight.castShadow = true;
            scene.add(streetSpotLight);

            // Add controls
            const streetLightFolder = streetlightsFolder.addFolder(
              'Street Light ' + child.name
            );
            streetLightFolder.add(streetSpotLight, 'intensity', 0, 1);
            streetLightFolder.add(streetSpotLight, 'angle', 0, Math.PI / 2);
            streetLightFolder.add(streetSpotLight, 'penumbra', 0, 1);
            streetLightFolder.close();
          } else {
            console.log('unhandled object', child.name, child.type);
          }
        }
      });

      streetlightsFolder.close();

      // gltf.scene.castShadow = true;
      // gltf.scene.receiveShadow = true;
      console.log(gltf.scene);
      console.log(gltf);
      scene.add(gltf.scene);
    });
  }

  // Lights

  // Ambient Light with reduced intensity since sky adds light
  {
    let ambientLight = new THREE.AmbientLight(0x9a9996, 2.5);
    scene.add(ambientLight);
  }

  gui.folders.forEach((x) => x.close());
}

function animate() {
  if (animationParams.enabled) {
    scene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        if (child.userData.seed !== undefined) {
          const time = Date.now() * 0.001 * animationParams.speed;
          const seed = child.userData.seed;

          // Use different sine waves with offsets for more chaotic movement
          child.rotation.x = Math.sin(time + seed) * animationParams.strength;
          child.rotation.z =
            Math.cos(time * 1.3 + seed * 2) * animationParams.strength;
        }
      }
    });
  }

  requestAnimationFrame(animate);

  composer.render();
}
