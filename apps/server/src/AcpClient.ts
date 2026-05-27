import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import * as readline from 'node:readline/promises';
import { Readable, Writable } from 'node:stream';
import { stdin as input, stdout as output } from 'node:process';
import * as acp from '@agentclientprotocol/sdk';
import { isGrokSessionUpdateParams, type GrokSessionUpdate } from '@repo/shared/types';

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

const SILENT = new Set(['available_commands_update', 'tool_call_delta_chunk']);

function isGrokSessionUpdateMethod(method: string): method is '_x.ai/session/update' | '_x.ai/session_notification' {
	return method === '_x.ai/session/update' || method === '_x.ai/session_notification';
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function toolOutput(raw: unknown): string | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	const type = o.type;
	if (type === 'Bash') {
		const text =
			(o.output_for_prompt as string) ||
			(Array.isArray(o.output) ? Buffer.from(o.output as number[]).toString('utf8') : '');
		return (
			[o.command && `$ ${o.command}`, o.exit_code !== undefined && `exit ${o.exit_code}`, text]
				.filter(Boolean)
				.join('\n') || null
		);
	}
	if (type === 'ReadFile') return (o.FileContent as { content?: string })?.content ?? null;
	if (type === 'ListDir') return (o.Content as { content?: string })?.content ?? null;
	if (type === 'GrepSearch') return Array.isArray(o.stdout) ? Buffer.from(o.stdout as number[]).toString('utf8') : null;
	if (type === 'SearchReplace')
		return (o.EditsApplied as { tool_output_for_prompt?: string })?.tool_output_for_prompt ?? null;
	if (type === 'WebSearch') return (o.content as string) ?? null;
	if (type === 'WebFetch') return (o.Content as { content?: string })?.content ?? null;
	if (type === 'Todo') return (o.TodosUpdated as { summary_for_prompt?: string })?.summary_for_prompt ?? null;
	const err = Object.keys(o).find(k => k !== 'type' && typeof o[k] === 'string');
	return err ? `${type} ${err}: ${o[err] as string}` : null;
}

class TaggedOutput {
	private open: string | null = null;
	private seenTool = new Map<string, string>();

	user(text: string) {
		this.closeTag();
		output.write(`<user>${esc(text)}</user>\n`);
	}

	update(u: GrokSessionUpdate) {
		switch (u.sessionUpdate) {
			case 'user_message_chunk':
			case 'agent_message_chunk':
			case 'agent_thought_chunk': {
				if (u.content.type !== 'text') break;
				const tag =
					u.sessionUpdate === 'user_message_chunk'
						? 'user'
						: u.sessionUpdate === 'agent_thought_chunk'
							? 'thinking'
							: 'assistant';
				if (tag === 'user') {
					this.closeTag();
					output.write(`<user>${esc(u.content.text)}</user>\n`);
				} else {
					this.stream(tag, u.content.text);
				}
				break;
			}
			case 'tool_call':
				this.closeTag();
				output.write(`<tool id="${esc(u.toolCallId)}" name="${esc(u.title)}"/>\n`);
				break;
			case 'tool_call_update': {
				this.closeTag();
				const attrs = [
					`id="${esc(u.toolCallId)}"`,
					u.status && `status="${esc(u.status)}"`,
					u.kind && `kind="${esc(u.kind)}"`,
				]
					.filter(Boolean)
					.join(' ');
				output.write(`<tool-update ${attrs}/>\n`);
				const out = toolOutput(u.rawOutput);
				if (out && out !== this.seenTool.get(u.toolCallId)) {
					this.seenTool.set(u.toolCallId, out);
					output.write(`<tool-output id="${esc(u.toolCallId)}">\n${esc(out)}\n</tool-output>\n`);
				}
				break;
			}
			case 'plan':
				this.closeTag();
				for (const e of u.entries) output.write(`<plan status="${esc(e.status)}">${esc(e.content)}</plan>\n`);
				break;
			default:
				if (!SILENT.has(u.sessionUpdate)) output.write(`<${u.sessionUpdate}/>\n`);
		}
	}

	turn(reason: acp.StopReason) {
		this.closeTag();
		output.write(`<turn reason="${esc(reason)}"/>\n`);
	}

	loaded(id: string) {
		this.closeTag();
		output.write(`<session-loaded id="${esc(id)}"/>\n`);
	}

	private stream(tag: string, chunk: string) {
		if (this.open !== tag) {
			this.closeTag();
			output.write(`<${tag}>`);
			this.open = tag;
		}
		output.write(chunk);
	}

	private closeTag() {
		if (this.open) {
			output.write(`</${this.open}>\n`);
			this.open = null;
		}
	}
}

function sessionCwd(id: string): string | null {
	const root = join(homedir(), '.grok/sessions');
	for (const dir of readdirSync(root)) {
		const summary = join(root, dir, id, 'summary.json');
		if (existsSync(summary)) return JSON.parse(readFileSync(summary, 'utf8')).info.cwd;
	}
	return null;
}

async function turn(client: ACPClient, out: TaggedOutput, text: string) {
	out.user(text);
	out.turn((await client.prompt(text)).stopReason);
}

async function main() {
	const [first, ...rest] = process.argv.slice(2);
	const cwdFromSession = first ? sessionCwd(first) : null;
	const sessionId = cwdFromSession ? first : undefined;
	const cwd = cwdFromSession ?? process.cwd();
	const prompt = (sessionId ? rest : process.argv.slice(2)).join(' ').trim();

	const client = new ACPClient({ cwd: resolve(cwd), sessionId });
	const out = new TaggedOutput();

	client.on('update', u => out.update(u));
	client.on('ready', ({ sessionId: id, loaded }) => loaded && out.loaded(id));
	process.on('SIGINT', () => {
		client.close();
		process.exit(0);
	});

	await client.connect();
	if (prompt) await turn(client, out, prompt);

	if (input.isTTY) {
		const rl = readline.createInterface({ input, output: process.stderr });
		for (let line = await rl.question('> '); line.trim(); line = await rl.question('> ')) {
			await turn(client, out, line.trim());
		}
		rl.close();
	}

	client.close();
}

if (import.meta.main) {
	main().catch(err => {
		console.error(err.message);
		process.exit(1);
	});
}
