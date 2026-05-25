import { sveltekit } from '@sveltejs/kit/vite';
import env from '@agent-manager/shared/env';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['agent-manager.localhost'],
		port: env.UI_PORT,
		strictPort: true,
		proxy: {
			'/api': {
				target: env.API_URL,
				changeOrigin: true,
			},
		},
	},
});
