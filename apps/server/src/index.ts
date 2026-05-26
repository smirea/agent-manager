import env from '@repo/shared/env';
import type { AgentEvent } from '@repo/shared';
import fs from 'fs';
import path from 'path';

const uiBuildPath = new URL('../../ui/build/', import.meta.url);

const encoder = new TextEncoder();
const grokDir = path.join(process.env.HOME!, '.grok');
const grokProjectsDir = path.join(grokDir, 'sessions');

const server = Bun.serve({
	port: env.PORT,
	routes: {
		'/api/events': () => sse(),
		'/api/sessions': async () => {
			const result: any[] = [];
			const projects = (await listDir(grokProjectsDir)).filter(x => fs.statSync(x).isDirectory());
			for (const dir of projects) {
				result.push({
					path: dir,
					name: decodeURIComponent(dir)
						.slice(grokProjectsDir.length + 1)
						.replace(process.env.HOME! + path.sep, ''),
					sessions: await Promise.all(
						(await listDir(dir))
							.filter(x => fs.statSync(x).isDirectory())
							.map(async dir => ({
								path: dir,
								summary: JSON.parse((await fs.promises.readFile(path.join(dir, 'summary.json'))).toString()),
							})),
					),
				});
			}
			return json(result);
		},
	},
	fetch(request) {
		const url = new URL(request.url);

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'access-control-allow-headers': 'content-type, authorization',
					'access-control-allow-methods': 'GET, POST, OPTIONS',
					'access-control-allow-origin': '*',
				},
			});
		}

		return staticFile(url.pathname);
	},
});

const listDir = async (root: string) => (await fs.promises.readdir(root)).map(x => path.join(root, x));

const json = (data: unknown, init?: ResponseInit) =>
	Response.json(data, {
		...init,
		headers: {
			'access-control-allow-origin': '*',
			...init?.headers,
		},
	});

function sseEvent(event: AgentEvent) {
	return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function sse() {
	let heartbeat: Timer | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(sseEvent({ type: 'connected', now: new Date().toISOString() }));
			heartbeat = setInterval(() => {
				controller.enqueue(sseEvent({ type: 'heartbeat', now: new Date().toISOString() }));
			}, 2000);
		},
		cancel() {
			if (heartbeat) {
				clearInterval(heartbeat);
			}
		},
	});

	return new Response(stream, {
		headers: {
			'access-control-allow-origin': '*',
			'cache-control': 'no-cache',
			connection: 'keep-alive',
			'content-type': 'text/event-stream',
		},
	});
}

async function staticFile(pathname: string) {
	const path = pathname === '/' ? '/index.html' : pathname;
	const file = Bun.file(new URL(`.${path}`, uiBuildPath));

	if (await file.exists()) {
		return new Response(file);
	}

	const index = Bun.file(new URL('./index.html', uiBuildPath));
	if (await index.exists()) {
		return new Response(index);
	}

	return new Response('UI build not found. Run `bun run build` or use `bun run dev:web`.', {
		status: 404,
	});
}

console.log(`server listening on http://${server.hostname}:${server.port}`);
