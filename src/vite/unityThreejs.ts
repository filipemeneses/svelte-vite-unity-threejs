import fs from 'fs/promises';
import path from 'path';
import watch from 'glob-watcher';
import {
  convertUnityProjectToJson,
  interpretScene,
} from 'unity-to-json';
import { makeQueue } from './makeQueue';

const UNITY_PROJECT_PATH = path.resolve(__dirname, '../../unity/UnityProject');
const SCENE_FILENAME = 'SampleScene.unity';
const OUTPUT_PATH = '../lib/unity-scene.json';

let sceneFiles: any;
let guidMapping: any;
let filenameMapping: any;

const writeScene = async (json) => {
  await fs.writeFile(
    path.resolve(__dirname, OUTPUT_PATH),
    JSON.stringify(json, null, 2),
  );
};

const main = async () => {
  (
    {
      sceneFiles,
      guidMapping,
      filenameMapping,
    } = await convertUnityProjectToJson({
      unityProjectRootFolderPath: UNITY_PROJECT_PATH,
    })
  );

  const scene = sceneFiles.find((r) => r.filename.endsWith(SCENE_FILENAME));

  await writeScene(
    await interpretScene({
      sceneData: scene?.data,
      guidMapping,
      filenameMapping,
    }),
  );
};

const start = async () => {
  await main();

  const relativeWindowsSafeUrl = (url) => path.relative(
    process.cwd(),
    path.resolve(__dirname, url),
  ).replace(/\\/g, '/');

  const SCENE_FILES_GLOB = relativeWindowsSafeUrl(`${UNITY_PROJECT_PATH}/**/Assets/Scenes/*.unity`);
  const META_FILES_GLOB = relativeWindowsSafeUrl(`${UNITY_PROJECT_PATH}/**/Assets/**/*.meta`);
  const FBX_FILES_GLOB = relativeWindowsSafeUrl(`${UNITY_PROJECT_PATH}/**/Assets/**/*.fbx`);

  const watcher = watch([
    SCENE_FILES_GLOB,
    META_FILES_GLOB,
    FBX_FILES_GLOB,
  ], {
    delay: 0,
  });

  const queue = makeQueue();

  watcher.on('change', async (filepath: string) => {
    if (filepath.endsWith('.meta')) {
      return;
    }

    queue.add(main);
  });
};

/** @type {import('vite').Plugin} */
const unitySyncPlugin = {
  name: 'unity-sync-plugin',
  async config() {
    await start();
  },
};

export {
  unitySyncPlugin,
};
