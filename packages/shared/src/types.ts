import type * as acp from '@agentclientprotocol/sdk';

export type AcpUserMessageChunkUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'user_message_chunk' }>;
export type AcpAgentMessageChunkUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'agent_message_chunk' }>;
export type AcpAgentThoughtChunkUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'agent_thought_chunk' }>;
export type AcpPlanUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'plan' }>;
export type AcpAvailableCommandsUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'available_commands_update' }>;
export type AcpCurrentModeUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'current_mode_update' }>;
export type AcpConfigOptionUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'config_option_update' }>;
export type AcpSessionInfoUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'session_info_update' }>;
export type AcpUsageUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'usage_update' }>;

type AcpToolCallUpdate = Extract<acp.SessionUpdate, { sessionUpdate: 'tool_call_update' }>;
type AcpToolCall = Extract<acp.SessionUpdate, { sessionUpdate: 'tool_call' }>;

export type GrokToolRawInput =
	| GrokBashToolRawInput
	| GrokReadFileToolRawInput
	| GrokListDirToolRawInput
	| GrokGrepToolRawInput
	| GrokSearchReplaceToolRawInput
	| GrokWebSearchToolRawInput
	| GrokWebFetchToolRawInput
	| GrokTodoWriteToolRawInput
	| GrokWriteToolRawInput;

export type GrokBashToolRawInput = {
	variant?: 'Bash';
	command: string;
	background?: boolean;
	description?: string;
	is_background?: boolean;
	timeout?: number;
};

export type GrokReadFileToolRawInput = {
	variant?: 'ReadFile';
	target_file: string;
	limit?: number;
	offset?: number;
};

export type GrokListDirToolRawInput = {
	variant?: 'ListDir';
	target_directory: string;
};

export type GrokGrepToolRawInput = {
	variant?: 'Grep';
	pattern: string;
	'-A'?: number;
	'-B'?: number;
	'-i'?: boolean | null;
	glob?: string | null;
	head_limit?: number;
	multiline?: boolean;
	output_mode?: string;
	path?: string | null;
	type?: string | null;
};

export type GrokSearchReplaceToolRawInput = {
	variant?: 'SearchReplace';
	file_path: string;
	new_string: string;
	old_string: string;
	replace_all?: boolean;
};

export type GrokWebSearchToolRawInput = {
	variant?: 'WebSearch';
	allowed_domains?: string[];
	backend?: boolean;
	query?: string;
};

export type GrokWebFetchToolRawInput = {
	variant?: 'WebFetch';
	url: string;
};

export type GrokTodoWriteToolRawInput = {
	variant?: 'TodoWrite';
	merge: boolean;
	todos: GrokTodoInput[];
};

export type GrokWriteToolRawInput = {
	variant?: 'Write';
	content: string;
	filePath: string;
};

export type GrokTodoInput = {
	content: string;
	id: string;
	status: string;
};

export type GrokToolRawOutput =
	| GrokBashToolRawOutput
	| GrokReadFileToolRawOutput
	| GrokListDirToolRawOutput
	| GrokGrepSearchToolRawOutput
	| GrokSearchReplaceToolRawOutput
	| GrokWebSearchToolRawOutput
	| GrokWebFetchToolRawOutput
	| GrokTodoToolRawOutput
	| GrokSearchActionToolRawOutput;

export type GrokBashToolRawOutput = {
	type: 'Bash';
	command: string;
	current_dir: string;
	description: string | null;
	exit_code: number | null;
	output: number[];
	output_delta?: number[];
	output_file: string;
	output_for_prompt: string;
	signal: string | null;
	timed_out: boolean;
	total_bytes: number;
	truncated: boolean;
};

export type GrokReadFileToolRawOutput = {
	type: 'ReadFile';
	FileContent: {
		absolute_path: string;
		content: string;
		content_concise: string;
		content_hash: number;
		mtime_at_read: { Known: number };
		offset: number | null;
		raw_output: string;
		total_lines: number;
	};
};

export type GrokListDirToolRawOutput =
	| {
			type: 'ListDir';
			Content: {
				absolute_root_path: string;
				content: string;
			};
	  }
	| {
			type: 'ListDir';
			NotFound: string;
	  };

export type GrokGrepSearchToolRawOutput = {
	type: 'GrepSearch';
	exit_code: number;
	file_matches: GrokGrepFileMatch[];
	match_count: number;
	stderr: number[];
	stdout: number[];
};

export type GrokGrepFileMatch = {
	path: string;
	matches: Record<string, unknown>[];
};

export type GrokSearchReplaceToolRawOutput = {
	type: 'SearchReplace';
	EditsApplied: {
		absolute_path: string;
		edits: {
			details: Record<string, unknown>[];
		};
		new_string: string;
		old_string: string;
		tool_output_for_prompt: string;
		tool_output_for_prompt_concise: string;
	};
};

export type GrokWebSearchToolRawOutput = {
	type: 'WebSearch';
	allowed_domains: string[];
	citations: string[];
	content: string;
	query: string;
};

export type GrokWebFetchToolRawOutput = {
	type: 'WebFetch';
	Content: {
		bytes: number;
		content: string;
		content_type: string;
		status_code: number;
		url: string;
	};
};

export type GrokTodoToolRawOutput = {
	type: 'Todo';
	TodosUpdated: {
		state: {
			todos: Record<string, Record<string, unknown>>;
		};
		summary_for_prompt: string;
		todos: GrokTodoOutput[];
	};
};

export type GrokTodoOutput = {
	content: string;
	priority: string;
	status: string;
};

export type GrokSearchActionToolRawOutput = {
	id: string;
	status: string;
	action: {
		query: string;
		sources: { type: string; url: string }[];
		type: string;
	};
};

export type GrokToolCallUpdate = Omit<AcpToolCallUpdate, 'rawInput' | 'rawOutput' | 'sessionUpdate'> & {
	sessionUpdate: 'tool_call_update';
	rawInput?: GrokToolRawInput;
	rawOutput?: GrokToolRawOutput;
};

export type GrokToolCall = Omit<AcpToolCall, 'rawInput' | 'rawOutput' | 'sessionUpdate'> & {
	sessionUpdate: 'tool_call';
	rawInput?: GrokToolRawInput;
	rawOutput?: GrokToolRawOutput;
};

export type GrokRetryStateUpdate =
	| {
			sessionUpdate: 'retry_state';
			type: 'retrying';
			attempt: number;
			is_rate_limited?: boolean;
			max_retries: number;
			reason: string;
	  }
	| {
			sessionUpdate: 'retry_state';
			type: 'failed';
			error_type: string;
			message: string;
	  }
	| {
			sessionUpdate: 'retry_state';
			type: 'exhausted';
			attempt: number;
			is_rate_limited?: boolean;
			max_retries: number;
			reason?: string;
	  };

export type GrokAutoCompactCompletedUpdate = {
	sessionUpdate: 'auto_compact_completed';
	summary_preview: string | null;
	tokens_after: number;
};

export type GrokCompactionCheckpointUpdate = {
	sessionUpdate: 'compaction_checkpoint';
	checkpoint_file: string;
	checkpoint_id: string;
	created_at: string;
	prompt_index_at_compaction: number;
	schema_version: number;
};

export type GrokMemoryFlushStartedUpdate = {
	sessionUpdate: 'memory_flush_started';
};

export type GrokMemoryFlushCompletedUpdate = {
	sessionUpdate: 'memory_flush_completed';
	result: 'written' | 'nothing to store';
	path?: string;
};

export type GrokImageCompressedUpdate = {
	sessionUpdate: 'image_compressed';
	message: string;
	images: GrokCompressedImage[];
};

export type GrokCompressedImage = {
	index: number;
	original_bytes: number;
	original_height: number;
	original_width: number;
	compressed_bytes: number;
	compressed_height: number;
	compressed_width: number;
};

export type GrokUnknownExtensionUpdate<Name extends string> = {
	sessionUpdate: Name;
} & Record<string, unknown>;

export type GrokBinaryDiscoveredExtensionUpdate =
	| GrokUnknownExtensionUpdate<'auto_compact_cancelled'>
	| GrokUnknownExtensionUpdate<'auto_compact_failed'>
	| GrokUnknownExtensionUpdate<'auto_compact_started'>
	| GrokUnknownExtensionUpdate<'auto_continue_completed'>
	| GrokUnknownExtensionUpdate<'auto_recovery_exhausted'>
	| GrokUnknownExtensionUpdate<'auto_recovery_started'>
	| GrokUnknownExtensionUpdate<'best_of_n_completed'>
	| GrokUnknownExtensionUpdate<'best_of_n_started'>
	| GrokUnknownExtensionUpdate<'diff_review'>
	| GrokUnknownExtensionUpdate<'doom_loop_detected'>
	| GrokUnknownExtensionUpdate<'goal_updated'>
	| GrokUnknownExtensionUpdate<'hook_annotation'>
	| GrokUnknownExtensionUpdate<'hook_execution'>
	| GrokUnknownExtensionUpdate<'hooks_changed'>
	| GrokUnknownExtensionUpdate<'image_dropped'>
	| GrokUnknownExtensionUpdate<'memory_dream_completed'>
	| GrokUnknownExtensionUpdate<'memory_files'>
	| GrokUnknownExtensionUpdate<'memory_session_saved'>
	| GrokUnknownExtensionUpdate<'model_auto_switched'>
	| GrokUnknownExtensionUpdate<'monitor_event'>
	| GrokUnknownExtensionUpdate<'plugin_updates_installed'>
	| GrokUnknownExtensionUpdate<'plugins_changed'>
	| GrokUnknownExtensionUpdate<'rewind_marker'>
	| GrokUnknownExtensionUpdate<'scheduled_task_created'>
	| GrokUnknownExtensionUpdate<'scheduled_task_deleted'>
	| GrokUnknownExtensionUpdate<'scheduled_task_fired'>
	| GrokUnknownExtensionUpdate<'session_summary_generated'>
	| GrokUnknownExtensionUpdate<'subagent_finished'>
	| GrokUnknownExtensionUpdate<'subagent_progress'>
	| GrokUnknownExtensionUpdate<'subagent_spawned'>
	| GrokUnknownExtensionUpdate<'task_backgrounded'>
	| GrokUnknownExtensionUpdate<'task_completed'>
	| GrokUnknownExtensionUpdate<'tool_call_delta_chunk'>
	| GrokUnknownExtensionUpdate<'verification_completed'>
	| GrokUnknownExtensionUpdate<'verification_started'>;

export type GrokAcpSessionUpdate =
	| AcpUserMessageChunkUpdate
	| AcpAgentMessageChunkUpdate
	| AcpAgentThoughtChunkUpdate
	| GrokToolCall
	| GrokToolCallUpdate
	| AcpPlanUpdate
	| AcpAvailableCommandsUpdate
	| AcpCurrentModeUpdate
	| AcpConfigOptionUpdate
	| AcpSessionInfoUpdate
	| AcpUsageUpdate;

export type GrokExtensionSessionUpdate =
	| GrokRetryStateUpdate
	| GrokAutoCompactCompletedUpdate
	| GrokCompactionCheckpointUpdate
	| GrokMemoryFlushStartedUpdate
	| GrokMemoryFlushCompletedUpdate
	| GrokImageCompressedUpdate
	| GrokBinaryDiscoveredExtensionUpdate;

export type GrokSessionUpdate = GrokAcpSessionUpdate | GrokExtensionSessionUpdate;

export type GrokSessionUpdateMethod = 'session/update' | '_x.ai/session/update' | '_x.ai/session_notification';

export type GrokSessionUpdateParams = {
	_meta?: Record<string, unknown> | null;
	sessionId: acp.SessionId;
	update: GrokSessionUpdate;
};

export type GrokSessionUpdateJsonMessage = {
	method: GrokSessionUpdateMethod;
	params: GrokSessionUpdateParams;
	timestamp?: number;
};

export function isGrokSessionUpdate(value: unknown): value is GrokSessionUpdate {
	return (
		!!value &&
		typeof value === 'object' &&
		'sessionUpdate' in value &&
		typeof (value as { sessionUpdate?: unknown }).sessionUpdate === 'string'
	);
}

export function isGrokSessionUpdateParams(value: unknown): value is GrokSessionUpdateParams {
	return (
		!!value &&
		typeof value === 'object' &&
		typeof (value as { sessionId?: unknown }).sessionId === 'string' &&
		isGrokSessionUpdate((value as { update?: unknown }).update)
	);
}
