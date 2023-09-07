import { defineConfig } from 'vite'
import fs from 'fs'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { unitySyncPlugin } from './src/vite/unityThreejs'

/** @type {import('vite').Plugin} */
const hexLoader = {
    name: 'hex-loader',
    transform(code, id) {
        const [path, query] = id.split('?');
        if (query != 'raw-hex')
            return null;

        const data = fs.readFileSync(path);
        const hex = data.toString('base64');

        return `export default '${hex}';`;
    }
};

const fullReloadAlways = {
  name: 'fullReloadAlways',
  handleHotUpdate({ server }) {
    server.ws.send({ type: "full-reload" })
    return []
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    hexLoader,
    svelte(), 
    fullReloadAlways,
    unitySyncPlugin
  ],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
  assetsInclude: [
    "**/*.fbx"
  ],
  server: {
    watch: {
      ignored: ["**/unity/**"],
    },
  },
})
