import env from '@repo/shared/env';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { ORPCError, onError } from '@orpc/server';
import { router } from './rpc';

const uiBuildPath = new URL('../../ui/build/', import.meta.url);

const encoder = new TextEncoder();
const rpcHandler = new RPCHandler(router, {
	plugins: [
		new CORSPlugin({
			origin: '*',
			allowMethods: ['GET', 'POST', 'OPTIONS'],
			allowHeaders: ['content-type', 'authorization'],
		}),
	],
	interceptors: [
		onError(async (error, _options) => {
			console.error(error);
			const e: any = error;
			const isDefined = error instanceof ORPCError;
			throw new ORPCError(isDefined ? error.code : 'INTERNAL_SERVER_ERROR', {
				status: isDefined ? error.status : undefined,
				message: e?.message || (error as any)?.message || 'Internal server error',
				data: {
					...(isDefined ? error.data : {}),
					name: e?.name,
					message: e?.message,
					stack: e?.stack ?? (error as any)?.stack,
					cause: e?.cause,
					...(e && typeof e === 'object'
						? Object.fromEntries(Object.entries(e).filter(([k]) => !['name', 'message', 'stack', 'cause'].includes(k)))
						: { value: e }),
				},
			});
		}),
	],
});

const server = Bun.serve({
	port: env.PORT,
	routes: {
		'/api/events': () => sse(),
	},
	async fetch(request) {
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

		const { matched, response } = await rpcHandler.handle(request, {
			prefix: '/api/rpc',
			context: {},
		});

		if (matched) return response;

		return staticFile(url.pathname);
	},
});

function sseEvent(event: any) {
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
