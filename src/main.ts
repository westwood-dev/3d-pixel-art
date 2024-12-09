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

      // let bonesFolder = gui.addFolder('model').addFolder('Bones');

      gltf.scene.traverse((child) => {
        // if (child instanceof THREE.Mesh) {
        child.receiveShadow = true;
        child.castShadow = true;

        if (child instanceof THREE.Mesh) {
          child.receiveShadow = true;
          child.castShadow = true;
          assignMaterial(child, child.name, windowsFolder);
        } else if (child instanceof THREE.Bone) {
          setupBone(child);
        } else {
          console.log('unhandled object', child.name, child.type);
        }

        // console.log(child.name.toLowerCase());

        //   const name = child.name.toLowerCase();

        //   if (name.includes('building')) {
        //     if (name.includes('window')) {
        //       child.material = new MAT.WindowMaterial();
        //       windowsFolder.add(child.material, 'on');
        //     } else {
        //       child.material = MAT.buildingMat;
        //     }
        //   } else if (name.includes('carpark')) {
        //     child.material = MAT.carParkMat;
        //   } else if (name.includes('tarmac')) {
        //     child.material = MAT.tarmacMat;
        //   } else if (name.includes('tube')) {
        //     child.material = new MAT.RandomColour();
        //   } else if (name.includes('car')) {
        //     console.log('car', child.name);
        //     if (name.includes('body')) {
        //       console.log('body', child.name);
        //       child.material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        //     } else if (name.includes('window')) {
        //       child.material = new MAT.WindowMaterial();
        //       child.material.on = false;
        //       windowsFolder.add(child.material, 'on');
        //     } else if (name.includes('gray') || name.includes('wheel')) {
        //       child.material = MAT.grayMat;
        //     } else if (name.includes('tyre')) {
        //       child.material = MAT.tyreMat;
        //     } else if (name.includes('headlight')) {
        //       child.material = MAT.headlightMat;
        //     } else if (name.includes('taillight')) {
        //       child.material = MAT.taillightMat;
        //     } else {
        //       child.material = new MAT.RandomBrightColour();
        //     }
        //   } else {
        //     child.material = MAT.errorMat;
        //   }
        // } else if (child instanceof THREE.Bone) {
        //   // console.log('bone', child);
        //   if (
        //     !child.name.toLowerCase().includes('shoulder') &&
        //     !child.name.toLowerCase().includes('neutral')
        //   ) {
        //     // Add random seed for each bone
        //     child.userData.seed = Math.random() * 1000;
        //     child.userData.initialX = child.rotation.x;
        //     child.userData.initialZ = child.rotation.z;
        //     // let boneFolder = bonesFolder.addFolder(child.name);
        //     // boneFolder.add(child.rotation, 'x', -1, 1);
        //     // boneFolder.add(child.rotation, 'z', -1, 1);
        //   }
        // } else {
        //   console.log('unhandled object', child.name, child.type);
        // }
      });

      // gltf.scene.castShadow = true;
      // gltf.scene.receiveShadow = true;
      console.log(gltf.scene);
      console.log(gltf);
      scene.add(gltf.scene);
    });
  }

  // Lights
  let lightsFolder = gui.addFolder('Lights');

  // Ambient Light with reduced intensity since sky adds light
  {
    let ambientLight = new THREE.AmbientLight(0x9a9996, 4);
    scene.add(ambientLight);

    let folder = lightsFolder.addFolder('Ambient Light');
    folder.add(ambientLight, 'intensity', 0, 15);
    folder.addColor(ambientLight, 'color');
  }

  // Directional Light
  {
    let directionalLight = new THREE.DirectionalLight(0xfffc9c, 0.5);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    // directionalLight.shadow.radius = 0
    directionalLight.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight);

    let folder = lightsFolder.addFolder('Directional Light');
    folder.add(directionalLight, 'intensity', 0, 1);
    folder.addColor(directionalLight, 'color');
  }

  // Spot Light
  {
    // let spotLight = new THREE.SpotLight(0xff8800, 1, 10, Math.PI / 16, 0.02, 2);
    let spotLight = new THREE.SpotLight(0xff8800, 1, 10, Math.PI / 16, 0, 2);
    spotLight.position.set(0, 2, 0);
    let target = spotLight.target; //= new THREE.Object3D()
    scene.add(target);
    target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    // spotLight.shadow.radius = 0

    let folder = lightsFolder.addFolder('Spot Light');
    folder.add(spotLight, 'intensity', 0, 10);

    let positionFolder = folder.addFolder('Position');
    positionFolder.add(spotLight.position, 'x', -5, 5);
    positionFolder.add(spotLight.position, 'y', 0, 20);
    positionFolder.add(spotLight.position, 'z', -5, 5);

    let targetFolder = folder.addFolder('Target');
    targetFolder.add(target.position, 'x', -5, 5);
    targetFolder.add(target.position, 'z', -5, 5);
    // targetFolder.add(target.position, 'y', 0, 20);
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
