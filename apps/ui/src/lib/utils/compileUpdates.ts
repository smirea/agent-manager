import type {
	AcpAgentMessageChunkUpdate,
	GrokNamedTool,
	GrokSessionUpdate,
	GrokToolCall,
	GrokToolCallUpdate,
	GrokToolRawInput,
	GrokToolRawOutput,
	Merge,
} from '@repo/shared';
import type * as acp from '@agentclientprotocol/sdk';

type CompiledToolBase = Omit<GrokToolCall, 'rawInput' | 'rawOutput' | 'sessionUpdate'> & {
	type: 'tool';
	sessionUpdate: 'tool';
};

export type CompiledToolOf<T extends GrokNamedTool> = CompiledToolBase & {
	variant: T['variant'];
	rawInput?: T['rawInput'];
	rawOutput?: T['rawOutput'];
};

type CompiledToolKnown = CompiledToolOf<GrokNamedTool>;

type CompiledToolUnknown = CompiledToolBase & {
	variant?: undefined;
	rawInput?: GrokToolRawInput;
	rawOutput?: GrokToolRawOutput;
};

export type CompiledTool = CompiledToolKnown | CompiledToolUnknown;

export type ClankerTextContent = Merge<
	Extract<AcpAgentMessageChunkUpdate['content'], { type: 'text' }>,
	{ thinking?: boolean; thinkingDurationSec?: number }
>;

export type ClankerContent =
	| CompiledTool
	| ClankerTextContent
	| Exclude<AcpAgentMessageChunkUpdate['content'], { type: 'text' }>;

export type ClankerMessage = {
	role: 'clanker';
	id?: string;
	content: ClankerContent[];
};

type UserMessage = { role: 'user'; id?: string; content: acp.ContentBlock[] };
type Message = UserMessage | ClankerMessage;

type RawToolItem = GrokToolCall | GrokToolCallUpdate;

type CompiledListItem =
	| CompiledTool
	| Exclude<
			GrokSessionUpdate,
			{ sessionUpdate: 'available_commands_update' | 'current_mode_update' | `tool_call${string}` }
	  >;

type CompilingListItem =
	| RawToolItem
	| CompiledTool
	| Exclude<
			GrokSessionUpdate,
			{ sessionUpdate: 'available_commands_update' | 'current_mode_update' | `tool_call${string}` }
	  >;

export type CompiledUpdates = {
	mode: string;
	availableCommands: acp.AvailableCommand[];
	list: CompiledListItem[];
	chat: Message[];
};

function finalizeTool(item: RawToolItem): CompiledTool {
	const variant = item.rawInput?.variant;
	const compiled = { ...item, type: 'tool' as const, sessionUpdate: 'tool' as const };
	if (variant === undefined) return compiled as CompiledTool;
	return { ...compiled, variant } as CompiledTool;
}

function mergeToolUpdate(target: RawToolItem, update: RawToolItem) {
	for (const [key, value] of Object.entries(update)) {
		if (value == null && (key === 'title' || key === 'rawInput' || key === 'rawOutput')) continue;
		(target as Record<string, unknown>)[key] = value;
	}
}

export default function compileUpdates(updates: GrokSessionUpdate[]): CompiledUpdates {
	const availableCommands: acp.AvailableCommand[] = [];
	let mode = 'plan';
	const compilingList: CompilingListItem[] = [];
	const chat: Message[] = [];

	const tools: Record<string, number> = {};

	for (const item of updates) {
		switch (item.sessionUpdate) {
			case 'available_commands_update':
				availableCommands.splice(0, availableCommands.length, ...item.availableCommands);
				break;
			case 'current_mode_update':
				mode = item.currentModeId;
				break;
			case 'tool_call':
				tools[item.toolCallId] = compilingList.length;
				compilingList.push(item);
				break;
			case 'tool_call_update':
				if (tools[item.toolCallId] != null) mergeToolUpdate(compilingList[tools[item.toolCallId]] as RawToolItem, item);
				break;
			case 'tool_call_delta_chunk':
				// todo: empty?
				console.warn('TODO:', item.sessionUpdate);
				break;
			default:
				compilingList.push(item);
		}
	}

	for (const index of Object.values(tools)) {
		const item = compilingList[index];
		if (item.sessionUpdate !== 'tool_call' && item.sessionUpdate !== 'tool_call_update') continue;
		compilingList[index] = finalizeTool(item);
	}

	const list = compilingList as CompiledListItem[];

	const l = <T>(a: T[]) => a[a.length - 1];
	const appendContent = (content: acp.ContentBlock[], next: acp.ContentBlock) => {
		const last = l(content);
		if (last?.type === 'text' && next.type === 'text') {
			last.text += next.text;
		} else {
			content.push(next);
		}
	};

	let lastThinkingTime = 0;
	for (const [index, item] of list.entries()) {
		let last = l(chat);
		switch (item.sessionUpdate) {
			case 'user_message_chunk':
				if (!last || last.role !== 'user') {
					last = {
						role: 'user',
						id: item.messageId || undefined,
						content: [],
					};
					chat.push(last);
				}
				appendContent(last.content, item.content);
				break;
			case 'agent_thought_chunk':
			case 'agent_message_chunk':
				const content: ClankerContent = item.content;
				if (!last || last.role !== 'clanker') lastThinkingTime = 0;
				if (content.type === 'text' && item.sessionUpdate === 'agent_thought_chunk') {
					content.thinking = true;
					const { agentTimestampMs, turnStartMs } = (item._meta || {}) as {
						agentTimestampMs?: number;
						turnStartMs?: number;
						streamStartMs?: number;
					};
					if (lastThinkingTime === 0 && agentTimestampMs && turnStartMs) {
						content.thinkingDurationSec = Math.round((agentTimestampMs - turnStartMs) / 100) / 10;
						lastThinkingTime = agentTimestampMs;
					} else if (agentTimestampMs) {
						content.thinkingDurationSec = Math.round((agentTimestampMs - lastThinkingTime) / 100) / 10;
						lastThinkingTime = agentTimestampMs;
					}
				}
				if (last?.role === 'clanker') {
					const lc = l(last.content);
					if (lc.type === 'text' && content.type === 'text' && !!lc.thinking === content.thinking) {
						lc.text += content.text;
					} else {
						last.content.push(content);
					}
				} else {
					chat.push({
						role: 'clanker',
						id: item.messageId || undefined,
						content: [content],
					});
				}
				break;
			case 'tool':
				if (!last || last.role !== 'clanker') {
					console.warn('TODO: tool call but agent is not last message, this should not happen at index=', index);
					break;
				}
				last.content.push(item);
				break;
		}
	}

	return { mode, availableCommands, list, chat };
}
