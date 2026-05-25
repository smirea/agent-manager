import env from '@agent-manager/shared/env';
import type { Agent, AgentEvent, HealthResponse } from '@agent-manager/shared';

const host = '127.0.0.1';
const port = env.PORT;
const workspace = process.cwd();
const uiBuildPath = new URL('../../ui/build/', import.meta.url);

const agents: Agent[] = [
	{
		id: 'local-shell',
		name: 'Local shell',
		command: 'date',
		status: 'idle',
	},
];

const encoder = new TextEncoder();

function json(data: unknown, init?: ResponseInit) {
	return Response.json(data, {
		headers: {
			'access-control-allow-origin': '*',
			...init?.headers,
		},
		status: init?.status,
	});
}

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

async function runCommand() {
	const proc = Bun.spawn(['date'], {
		cwd: workspace,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [output, errorOutput, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);

	return json({
		command: 'date',
		exitCode,
		output: output.trim() || errorOutput.trim(),
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

Bun.serve({
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

		if (url.pathname === '/api/health') {
			const body: HealthResponse = {
				ok: true,
				runtime: 'bun',
				now: new Date().toISOString(),
				workspace,
			};
			return json(body);
		}

		if (url.pathname === '/api/agents') {
			return json({ agents });
		}

		if (url.pathname === '/api/commands/date' && request.method === 'POST') {
			return runCommand();
		}

		if (url.pathname === '/api/events') {
			return sse();
		}

		return staticFile(url.pathname);
	},
	hostname: host,
	port,
});

console.log(`agent-manager server listening on http://${host}:${port}`);
