import env from '@agent-manager/shared/env';

const url = `http://127.0.0.1:${env.UI_PORT}`;

for (let attempt = 0; attempt < 100; attempt += 1) {
	try {
		const response = await fetch(url);
		if (response.ok) {
			process.exit(0);
		}
	} catch {}

	await new Promise(resolve => setTimeout(resolve, 100));
}

console.error(`UI did not respond at ${url}`);
process.exit(1);
