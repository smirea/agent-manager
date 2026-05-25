import { defineConfig } from 'electron-vite';

export default defineConfig({
	main: {
		build: {
			rollupOptions: {
				input: 'src/main.ts',
			},
		},
	},
});
