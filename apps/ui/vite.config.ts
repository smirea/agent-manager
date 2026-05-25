import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const apiUrl = process.env.AGENT_MANAGER_API_URL ?? 'http://agent-manager-api.localhost';
const uiPort = Number(process.env.AGENT_MANAGER_UI_PORT ?? '6050');

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['agent-manager.localhost'],
		port: uiPort,
		proxy: {
			'/api': {
				target: apiUrl,
				changeOrigin: true,
			},
		},
	},
});
