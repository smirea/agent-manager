import type {
	AcpAgentMessageChunkUpdate,
	GrokSessionUpdate,
	GrokToolCall,
	GrokToolCallUpdate,
	Merge,
} from '@repo/shared';
import type * as acp from '@agentclientprotocol/sdk';

type Tool = Merge<Merge<GrokToolCall, GrokToolCallUpdate>, { type: 'tool'; sessionUpdate: 'tool' }>;
type ClankerContent =
	| Tool
	| Merge<
			AcpAgentMessageChunkUpdate['content'] & { type: 'text' },
			{ thinking?: boolean; thinkingDurationSec?: number }
	  >
	| Exclude<AcpAgentMessageChunkUpdate['content'], { type: 'text' }>;
export type ClankerMessage = {
	role: 'clanker';
	id?: string;
	content: ClankerContent[];
};
type Message = { role: 'user'; id?: string; text: string } | ClankerMessage;

export default function compileUpdates(updates: GrokSessionUpdate[]) {
	const result = {
		mode: 'plan',
		availableCommands: [] as acp.AvailableCommand[],
		list: [] as Array<
			| Tool
			| Exclude<
					GrokSessionUpdate,
					{ sessionUpdate: 'available_commands_update' | 'current_mode_update' | `tool_call${string}` }
			  >
		>,
		chat: [] as Message[],
	};

	const tools: Record<string, number> = {};

	console.info(updates);

	for (const item of updates) {
		switch (item.sessionUpdate) {
			case 'available_commands_update':
				result.availableCommands = item.availableCommands;
				break;
			case 'current_mode_update':
				result.mode = item.currentModeId;
				break;
			case 'tool_call':
				tools[item.toolCallId] = result.list.length;
				result.list.push(item as any);
				break;
			case 'tool_call_update':
				if (tools[item.toolCallId] != null) Object.assign(result.list[tools[item.toolCallId]], item);
				break;
			case 'tool_call_delta_chunk':
				// todo: empty?
				console.warn('TODO:', item.sessionUpdate);
				break;
			default:
				result.list.push(item);
		}
	}

	Object.values(tools).forEach(index => Object.assign(result.list[index], { type: 'tool', sessionUpdate: 'tool' }));
	const l = <T>(a: T[]) => a[a.length - 1];

	let lastThinkingTime = 0;
	for (const [index, item] of result.list.entries()) {
		let last = l(result.chat);
		switch (item.sessionUpdate) {
			case 'user_message_chunk':
				if (!last || last.role !== 'user') {
					last = {
						role: 'user',
						id: item.messageId || undefined,
						text: '',
					};
					result.chat.push(last);
				}
				switch (item.content.type) {
					case 'text':
						last.text += item.content.text;
						break;
					default:
						console.warn('TODO:', item.content);
				}
				break;
			case 'agent_thought_chunk':
			case 'agent_message_chunk':
				const content: ClankerContent = item.content;
				if (last.role !== 'clanker') lastThinkingTime = 0;
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
				if (last.role === 'clanker') {
					const lc = l(last.content);
					if (lc.type === 'text' && content.type === 'text' && !!lc.thinking === content.thinking) {
						lc.text += content.text;
					} else if (content.type === 'text') {
						last.content.push(content);
					}
				} else {
					result.chat.push({
						role: 'clanker',
						id: item.messageId || undefined,
						content: [content],
					});
				}
				break;
			case 'tool':
				if (last.role !== 'clanker') {
					console.warn('TODO: tool call but agent is not last message, this should not happen at index=', index);
					break;
				}
				last.content.push(item);
				break;
		}
	}

	return result;
}
