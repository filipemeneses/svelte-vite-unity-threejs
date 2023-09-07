import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const parseGltf = async (fbxObject): Promise<THREE.Group> => (
  new Promise((resolve, reject) => {
    new GLTFLoader().parse(fbxObject, '', (e) => {
      resolve(e);
    }, (e) => {
      reject(e);
    });
  })
);
function decode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const cloneGltf = (gltf) => {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true),
  };

  const skinnedMeshes = {};

  gltf.scene.traverse((node) => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.scene.traverse((node) => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }

    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const { skeleton } = skinnedMesh;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld,
    );
  }

  return clone;
};

export const readUnityJson = async (threeJsParsable, { scene, camera, controls }) => {
  const gltfObjects = {};

  await Promise.all(Object.entries(threeJsParsable.references)
    .map(async ([key, value]) => {
      try {
        gltfObjects[key] = await parseGltf(
          decode(value),
        );
      } catch (e) {
        console.error(e);
      }
    }));

  const instances = [];

  const parsePrefab = (instance) => {
    const clone = cloneGltf(gltfObjects[instance.sourceGuid]);
    const instanceGroup = clone.scene;
    instanceGroup.name = instance.props.m_Name;

    const changeableGroup = instanceGroup;

    const { props } = instance;

    const positionX = 100 * Number(props['m_LocalPosition.x']);
    const positionY = 100 * Number(props['m_LocalPosition.y']);
    const positionZ = -100 * Number(props['m_LocalPosition.z']);

    const scaleX = 100 * Number(props['m_LocalScale.x'] || 1);
    const scaleY = 100 * Number(props['m_LocalScale.y'] || 1);
    const scaleZ = -100 * Number(props['m_LocalScale.z'] || 1);

    const rotationW = Number(props['m_LocalRotation.w'] || 1);
    const rotationX = Number(props['m_LocalRotation.x'] || 1);
    const rotationY = Number(props['m_LocalRotation.y'] || 1);
    const rotationZ = Number(props['m_LocalRotation.z'] || 1);

    changeableGroup.position.set(positionX, positionY, positionZ);

    changeableGroup.scale.setX(scaleX);
    changeableGroup.scale.setY(scaleY);
    changeableGroup.scale.setZ(scaleZ);

    changeableGroup.rotation.setFromQuaternion(
      new THREE.Quaternion(rotationX, rotationY, -rotationZ, -rotationW),
    );

    const box3 = new THREE.Box3().setFromObject(changeableGroup);
    scene.add(new THREE.Box3Helper(box3, 0xFF0000));

    scene.add(instanceGroup);
    instances.push(instanceGroup);
  };

  const parseCamera = (instance) => {
    const {
      x, y, z,
    } = instance.props.transform.m_LocalPosition;
    const localRotation = instance.props.transform.m_LocalRotation;
    const unityCamera = instance.props.camera;

    camera.position.setX(Number(x) * 100);
    camera.position.setY(Number(y) * 100);
    camera.position.setZ(Number(z) * -100);
    camera.fov = Number(unityCamera['field of view']) + 5.8;

    const rotationW = Number(localRotation.w || 1);
    const rotationX = Number(localRotation.x || 1);
    const rotationY = Number(localRotation.y || 1);
    const rotationZ = Number(localRotation.z || 1);

    camera.updateProjectionMatrix();

    controls.update();

    camera.rotation.setFromQuaternion(
      new THREE.Quaternion(rotationX, rotationY, -rotationZ, -rotationW),
    );
  };

  threeJsParsable.instances.forEach((instance) => {
    const handles = {
      prefab: parsePrefab,
      camera: parseCamera,
    };

    const handler = handles[instance.props.type];
    if (!handler) {
      return;
    }

    handler(instance);
  });
};
