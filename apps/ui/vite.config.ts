import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const apiUrl = process.env.API_URL ?? 'http://agent-manager-api.localhost';
const uiPort = Number(process.env.UI_PORT ?? '6050');

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['agent-manager.localhost'],
		port: uiPort,
		strictPort: true,
		proxy: {
			'/api': {
				target: apiUrl,
				changeOrigin: true,
			},
		},
	},
});
