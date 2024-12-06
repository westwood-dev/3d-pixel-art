import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import RenderPixelatedPass from './RenderPixelatedPass.ts';
import PixelatePass from './PixelatePass';

let camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer;
let controls: OrbitControls;
let gui: GUI;

init();
animate();

function init() {
  // GUI
  gui = new GUI();

  let screenResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  );

  let pixelSize = { value: 4 };

  let renderResolution = screenResolution.clone().divideScalar(pixelSize.value);

  renderResolution.x |= 0;
  renderResolution.y |= 0;

  let aspectRatio = screenResolution.x / screenResolution.y;

  camera = new THREE.OrthographicCamera(
    -aspectRatio,
    aspectRatio,
    1,
    -1,
    0.01,
    10
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

  gui.add(pixelSize, 'value', 1, 10, 1).onChange((value: number) => {
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

  const texLoader = new THREE.TextureLoader();
  const tex_checker = pixelTex(
    texLoader.load(
      'https://threejsfundamentals.org/threejs/resources/images/checker.png'
    )
  );
  const tex_checker2 = pixelTex(
    texLoader.load(
      'https://threejsfundamentals.org/threejs/resources/images/checker.png'
    )
  );
  tex_checker.repeat.set(3, 3);
  tex_checker2.repeat.set(1.5, 1.5);

  // Geometry
  {
    const loader = new GLTFLoader();

    const modelScale = 0.15;

    loader.load('/models/model.gltf', (gltf) => {
      gltf.scene.scale.set(modelScale, modelScale, modelScale);
      gltf.scene.castShadow = true;
      gltf.scene.receiveShadow = true;
      console.log(gltf.scene);
      scene.add(gltf.scene);
    });
  }

  // Lights
  let lightsFolder = gui.addFolder('Lights');

  // Ambient Light
  {
    let ambientLight = new THREE.AmbientLight(0x9a9996, 8.4);
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
}

function animate() {
  requestAnimationFrame(animate);

  composer.render();
}

function pixelTex(tex: THREE.Texture) {
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
