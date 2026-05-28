import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Readable, Writable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';
import { isGrokSessionUpdateParams, type GrokSessionUpdate } from '@repo/shared';

export type GrokACPClientEventMap = {
	ready: [{ sessionId: acp.SessionId; protocolVersion: acp.ProtocolVersion; loaded: boolean }];
	update: [GrokSessionUpdate];
	complete: [acp.PromptResponse];
	error: [Error];
	close: [];
};

export type GrokACPClientOptions = {
	cwd?: string;
	grokPath?: string;
	sessionId?: acp.SessionId;
};

export class ACPClient extends EventEmitter<GrokACPClientEventMap> {
	private proc: ChildProcessWithoutNullStreams | null = null;
	private connection: acp.ClientSideConnection | null = null;
	private sessionId: acp.SessionId | null = null;
	private readonly cwd: string;
	private readonly grokPath: string;
	private readonly loadSessionId: acp.SessionId | null;

	constructor(options: GrokACPClientOptions = {}) {
		super();
		this.cwd = resolve(options.cwd ?? process.cwd());
		this.grokPath = options.grokPath ?? 'grok';
		this.loadSessionId = options.sessionId ?? null;
	}

	get currentSessionId(): acp.SessionId | null {
		return this.sessionId;
	}

	async connect(): Promise<acp.SessionId> {
		if (this.sessionId && this.connection) return this.sessionId;

		this.proc = spawn(this.grokPath, ['agent', 'stdio'], {
			stdio: ['pipe', 'pipe', 'inherit'],
		}) as any;

		this.proc!.on('exit', () => {
			this.connection = null;
			this.sessionId = null;
			this.emit('close');
		});

		const stream = acp.ndJsonStream(
			Writable.toWeb(this.proc!.stdin!),
			Readable.toWeb(this.proc!.stdout!) as unknown as ReadableStream<Uint8Array>,
		);

		const client: acp.Client = {
			sessionUpdate: async params => void this.emit('update', params.update as GrokSessionUpdate),
			requestPermission: async params => {
				const option = params.options.find(o => o.kind === 'allow_once') ?? params.options[0];
				if (!option) throw new Error('No permission options offered');
				return { outcome: { outcome: 'selected', optionId: option.optionId } };
			},
			readTextFile: async params => ({ content: readFileSync(params.path, 'utf8') }),
			writeTextFile: async params => {
				writeFileSync(params.path, params.content, 'utf8');
				return {};
			},
			extNotification: async (method, params) => {
				if (isGrokSessionUpdateMethod(method) && isGrokSessionUpdateParams(params)) {
					this.emit('update', params.update);
				}
			},
		};

		this.connection = new acp.ClientSideConnection(() => client, stream);

		const init = await this.connection.initialize({
			protocolVersion: acp.PROTOCOL_VERSION,
			clientCapabilities: { fs: { readTextFile: true, writeTextFile: true } },
		});

		if (this.loadSessionId) {
			await this.connection.loadSession({
				sessionId: this.loadSessionId,
				cwd: this.cwd,
				mcpServers: [],
			});
			this.sessionId = this.loadSessionId;
			this.emit('ready', { sessionId: this.sessionId, protocolVersion: init.protocolVersion, loaded: true });
		} else {
			const session = await this.connection.newSession({ cwd: this.cwd, mcpServers: [] });
			this.sessionId = session.sessionId;
			this.emit('ready', { sessionId: session.sessionId, protocolVersion: init.protocolVersion, loaded: false });
		}

		return this.sessionId!;
	}

	async prompt(text: string): Promise<acp.PromptResponse> {
		if (!this.connection || !this.sessionId) throw new Error('Not connected');
		const result = await this.connection.prompt({
			sessionId: this.sessionId,
			prompt: [{ type: 'text', text }],
		});
		this.emit('complete', result);
		return result;
	}

	close(): void {
		this.proc?.kill();
		this.proc = null;
		this.connection = null;
		this.sessionId = null;
	}
}

function isGrokSessionUpdateMethod(method: string): method is '_x.ai/session/update' | '_x.ai/session_notification' {
	return method === '_x.ai/session/update' || method === '_x.ai/session_notification';
}
