import { app, BrowserWindow } from 'electron';
import env from '@repo/shared/env';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let serverProcess: ChildProcess | undefined;

const serverDir = fileURLToPath(new URL('../../../server', import.meta.url));

function startServer() {
	if (env.SKIP_SERVER) {
		return;
	}

	serverProcess = spawn('bun', ['run', 'dev'], {
		cwd: serverDir,
		stdio: 'inherit',
	});
}

async function waitForServer() {
	for (let attempt = 0; attempt < 80; attempt += 1) {
		try {
			const response = await fetch(`${env.SERVER_URL}/api/health`);
			if (response.ok) {
				return;
			}
		} catch {}

		await new Promise(resolve => setTimeout(resolve, 100));
	}

	throw new Error(`Server did not respond at ${env.SERVER_URL}`);
}

async function createWindow() {
	await waitForServer();

	const window = new BrowserWindow({
		height: 760,
		show: !env.SMOKE,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
		width: 1120,
	});

	await window.loadURL(env.UI_URL);

	if (env.SMOKE) {
		const health = await window.webContents.executeJavaScript('fetch("/api/health").then((r) => r.json())');
		console.log(`electron smoke loaded ${health.runtime} backend at ${health.now}`);
		app.quit();
	}
}

app.whenReady().then(() => {
	startServer();
	createWindow().catch(error => {
		console.error(error);
		app.exit(1);
	});
});

app.on('window-all-closed', () => {
	app.quit();
});

app.on('before-quit', () => {
	serverProcess?.kill();
});
