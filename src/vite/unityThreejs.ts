import fs from 'fs/promises';
import path from 'path';
import {
  createUnityProjectToJsonWatcher,
} from 'unity-to-json';

const UNITY_PROJECT_PATH = path.resolve(__dirname, '../../unity/UnityProject');
const SCENE_FILENAME = 'SampleScene.unity';
const OUTPUT_PATH = '../lib/unity-scene.json';

const writeScene = async (json) => {
  await fs.writeFile(
    path.resolve(__dirname, OUTPUT_PATH),
    JSON.stringify(json, null, 2),
  );
};

const startWatcher = async () => {
  createUnityProjectToJsonWatcher({
    unityProjectRootFolderPath: UNITY_PROJECT_PATH,
    sceneFilename: SCENE_FILENAME,
    async onSceneChange(context) {
      await writeScene(
        context,
      );
    },
  });
};

/** @type {import('vite').Plugin} */
const unitySyncPlugin = {
  name: 'unity-sync-plugin',
  async config() {
    await startWatcher();
  },
};

export {
  unitySyncPlugin,
};
