const port = process.env.AGENT_MANAGER_UI_PORT ?? '6050';
const url = `http://127.0.0.1:${port}`;

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
