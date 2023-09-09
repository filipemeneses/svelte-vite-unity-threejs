import * as THREE from 'three';
import { createUnityJsonToThreeJsParser } from 'unity-to-json-threejs-parser';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import unityProjectJson from './unity-scene.json';

const parseUnityJsonToThreejs = createUnityJsonToThreeJsParser({ THREE, GLTFLoader });

export const mountThreeJsExample = async (container: Element) => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    2000,
  );
  camera.position.set(100, 200, 300);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

  const dirLight = new THREE.DirectionalLight(0xffffff, 5);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  container.appendChild(renderer.domElement);

  const tick = () => {
    requestAnimationFrame(tick);

    renderer.render(scene, camera);
  };

  tick();

  const instances = await parseUnityJsonToThreejs('SampleScene', unityProjectJson);

  instances.forEach((instance) => {
    if (instance instanceof THREE.Group) {
      scene.add(instance);
    }
    if (instance instanceof THREE.Camera) {
      camera.copy(instance);
    }
  });
};
