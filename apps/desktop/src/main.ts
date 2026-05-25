import { app, BrowserWindow } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let serverProcess: ChildProcess | undefined;

const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
const serverDir = fileURLToPath(new URL('../../server', import.meta.url));
const uiUrl = process.env.AGENT_MANAGER_UI_URL ?? 'http://127.0.0.1:5173';
const serverUrl = process.env.AGENT_MANAGER_SERVER_URL ?? 'http://127.0.0.1:3031';
const smoke = process.env.AGENT_MANAGER_SMOKE === '1';

function startServer() {
	if (process.env.AGENT_MANAGER_SKIP_SERVER === '1') {
		return;
	}

	serverProcess = spawn('bun', ['--cwd', serverDir, 'run', 'dev'], {
		cwd: rootDir,
		env: {
			...process.env,
			AGENT_MANAGER_PORT: '3031',
		},
		stdio: 'inherit',
	});
}

async function waitForServer() {
	for (let attempt = 0; attempt < 80; attempt += 1) {
		try {
			const response = await fetch(`${serverUrl}/api/health`);
			if (response.ok) {
				return;
			}
		} catch {}

		await new Promise(resolve => setTimeout(resolve, 100));
	}

	throw new Error(`Server did not respond at ${serverUrl}`);
}

async function createWindow() {
	await waitForServer();

	const window = new BrowserWindow({
		height: 760,
		show: !smoke,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
		width: 1120,
	});

	await window.loadURL(uiUrl);

	if (smoke) {
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
