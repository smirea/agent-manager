import { sveltekit } from '@sveltejs/kit/vite';
import env from '@repo/shared/env';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: ['agent-manager.localhost'],
		port: env.UI_PORT,
		strictPort: true,
		proxy: {
			'/api': {
				target: env.SERVER_URL,
				changeOrigin: true,
			},
		},
	},
});
