import type * as acp from '@agentclientprotocol/sdk';

// Derived from grok CLI v0.2.33 session logs + ACP SDK schema.
// https://agentclientprotocol.com/protocol/tool-calls

type AcpSessionUpdateOf<K extends acp.SessionUpdate['sessionUpdate']> = Extract<
	acp.SessionUpdate,
	{ sessionUpdate: K }
>;

export type AcpUserMessageChunkUpdate = AcpSessionUpdateOf<'user_message_chunk'>;
export type AcpAgentMessageChunkUpdate = AcpSessionUpdateOf<'agent_message_chunk'>;
export type AcpAgentThoughtChunkUpdate = AcpSessionUpdateOf<'agent_thought_chunk'>;
export type AcpPlanUpdate = AcpSessionUpdateOf<'plan'>;
export type AcpAvailableCommandsUpdate = AcpSessionUpdateOf<'available_commands_update'>;
export type AcpCurrentModeUpdate = AcpSessionUpdateOf<'current_mode_update'>;
export type AcpConfigOptionUpdate = AcpSessionUpdateOf<'config_option_update'>;
export type AcpSessionInfoUpdate = AcpSessionUpdateOf<'session_info_update'>;
export type AcpUsageUpdate = AcpSessionUpdateOf<'usage_update'>;

type AcpToolCall = AcpSessionUpdateOf<'tool_call'>;
type AcpToolCallUpdate = AcpSessionUpdateOf<'tool_call_update'>;

export type GrokByteArray = number[];

type GrokToolInput<V extends string> = { variant?: V };
type GrokToolSpec<V extends string, RawInput extends GrokToolInput<V>, RawOutput> = {
	variant: V;
	rawInput: RawInput;
	rawOutput: RawOutput;
};

// --- Shared output shapes (reused across tools) ---

export type GrokReadFileContent = {
	absolute_path: string;
	content: string;
	content_concise: string;
	content_hash: number;
	mtime_at_read: { Known: number };
	offset: number | null;
	raw_output: string;
	total_lines: number;
};

export type GrokGrepMatch = {
	line_number: number;
	content: string;
};

export type GrokGrepFileMatch = {
	path: string;
	matches: GrokGrepMatch[];
};

export type GrokSearchReplaceEditDetail = {
	old_string: string;
	old_line: number;
	new_string: string;
	new_line: number;
	context_before: string;
	context_after: string;
	line_prefix: string;
};

export type GrokSearchReplaceEditsApplied = {
	absolute_path: string;
	old_string: string;
	new_string: string;
	tool_output_for_prompt: string;
	tool_output_for_prompt_concise: string;
	edits: { details: GrokSearchReplaceEditDetail[] };
};

export type GrokSearchReplaceNoMatchesFound = {
	message: string;
	file_path: string;
};

export type GrokSearchReplaceToolRawOutput =
	| { type: 'SearchReplace'; EditsApplied: GrokSearchReplaceEditsApplied }
	| { type: 'SearchReplace'; NoMatchesFound: GrokSearchReplaceNoMatchesFound };

export type GrokBackgroundTaskStartedOutput = {
	type: 'BackgroundTaskStarted';
	task_id: string;
	task_type: string;
	output_file: string;
	status: string;
	command: string;
	summary: string;
	retrieval_hint: string;
	pid: number;
};

export type GrokBashToolRawOutput = {
	type: 'Bash';
	command: string;
	current_dir: string;
	description: string | null;
	exit_code: number | null;
	output?: GrokByteArray;
	output_delta?: GrokByteArray;
	output_file: string;
	output_for_prompt: string;
	signal: string | null;
	timed_out: boolean;
	total_bytes: number;
	truncated: boolean;
};

export type GrokTextToolRawOutput = {
	type: 'Text';
	text: string;
};

// --- Native Grok tools ---

export type GrokBashToolRawInput = GrokToolInput<'Bash'> & {
	command: string;
	description?: string;
	is_background?: boolean;
	timeout?: number;
};

export type GrokBashTool = GrokToolSpec<
	'Bash',
	GrokBashToolRawInput,
	GrokBashToolRawOutput | GrokBackgroundTaskStartedOutput
>;

export type GrokReadFileToolRawInput = GrokToolInput<'ReadFile'> & {
	target_file: string;
	limit?: number;
	offset?: number;
};

export type GrokReadFileToolRawOutput = {
	type: 'ReadFile';
	FileContent: GrokReadFileContent;
};

export type GrokReadFileTool = GrokToolSpec<'ReadFile', GrokReadFileToolRawInput, GrokReadFileToolRawOutput>;

export type GrokListDirToolRawInput = GrokToolInput<'ListDir'> & {
	target_directory: string;
};

export type GrokListDirToolRawOutput =
	| { type: 'ListDir'; Content: { absolute_root_path: string; content: string } }
	| { type: 'ListDir'; NotFound: string };

export type GrokListDirTool = GrokToolSpec<'ListDir', GrokListDirToolRawInput, GrokListDirToolRawOutput>;

export type GrokGrepToolRawInput = GrokToolInput<'Grep'> & {
	pattern: string;
	path?: string | null;
	glob?: string | null;
	type?: string | null;
	head_limit?: number;
	multiline?: boolean;
	output_mode?: 'content' | 'files_with_matches' | 'count' | (string & {});
	'-A'?: number;
	'-B'?: number;
	'-i'?: boolean | null;
};

export type GrokGrepToolRawOutput = {
	type: 'GrepSearch';
	exit_code: number;
	file_matches: GrokGrepFileMatch[];
	match_count: number;
	stderr: GrokByteArray;
	stdout: GrokByteArray;
};

export type GrokGrepTool = GrokToolSpec<'Grep', GrokGrepToolRawInput, GrokGrepToolRawOutput>;

export type GrokSearchReplaceToolRawInput = GrokToolInput<'SearchReplace'> & {
	file_path: string;
	old_string: string;
	new_string: string;
	replace_all?: boolean;
};

export type GrokSearchReplaceTool = GrokToolSpec<
	'SearchReplace',
	GrokSearchReplaceToolRawInput,
	GrokSearchReplaceToolRawOutput
>;

export type GrokWebSearchToolRawInput = GrokToolInput<'WebSearch'> & {
	query?: string;
	backend?: boolean;
	allowed_domains?: string[];
};

export type GrokWebSearchToolRawOutput = {
	type: 'WebSearch';
	query: string;
	content: string;
	citations: string[];
	allowed_domains: string[] | null;
	pre_formatted?: string;
};

export type GrokWebSearchTool = GrokToolSpec<'WebSearch', GrokWebSearchToolRawInput, GrokWebSearchToolRawOutput>;

export type GrokWebFetchToolRawInput = GrokToolInput<'WebFetch'> & {
	url: string;
};

export type GrokWebFetchToolRawOutput = {
	type: 'WebFetch';
	Content: {
		url: string;
		content: string;
		content_type: string;
		status_code: number;
		bytes: number;
	};
};

export type GrokWebFetchTool = GrokToolSpec<'WebFetch', GrokWebFetchToolRawInput, GrokWebFetchToolRawOutput>;

export type GrokTodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | (string & {});

export type GrokTodoInput = {
	id: string;
	content: string;
	status: GrokTodoStatus;
};

export type GrokTodoOutput = {
	content: string;
	priority: string;
	status: GrokTodoStatus;
};

export type GrokTodoWriteToolRawInput = GrokToolInput<'TodoWrite'> & {
	merge: boolean;
	todos: GrokTodoInput[];
};

export type GrokTodoWriteToolRawOutput = {
	type: 'Todo';
	TodosUpdated: {
		summary_for_prompt: string;
		todos: GrokTodoOutput[];
		state: { todos: Record<string, GrokTodoOutput & { id?: string }> };
	};
};

export type GrokTodoWriteTool = GrokToolSpec<'TodoWrite', GrokTodoWriteToolRawInput, GrokTodoWriteToolRawOutput>;

export type GrokWriteToolRawInput = GrokToolInput<'Write'> & {
	filePath: string;
	content: string;
};

/** Write completes with the same SearchReplace/EditsApplied payload as patch edits. */
export type GrokWriteTool = GrokToolSpec<'Write', GrokWriteToolRawInput, GrokSearchReplaceToolRawOutput>;

export type GrokNativeTool =
	| GrokBashTool
	| GrokReadFileTool
	| GrokListDirTool
	| GrokGrepTool
	| GrokSearchReplaceTool
	| GrokWebSearchTool
	| GrokWebFetchTool
	| GrokTodoWriteTool
	| GrokWriteTool;

// --- Backend web search streaming (no rawInput.variant) ---

export type GrokSearchActionSource = { type: string; url: string };

export type GrokSearchActionAction =
	| { type: 'search'; query: string; sources: GrokSearchActionSource[] }
	| { type: 'open_page'; url: string };

export type GrokSearchActionToolRawOutput = {
	id: string;
	status: string;
	action: GrokSearchActionAction;
};

/** Emitted during WebSearch backend streaming; pairs with WebSearch final output. */
export type GrokSearchActionTool = {
	variant?: never;
	rawInput?: never;
	rawOutput: GrokSearchActionToolRawOutput;
};

// --- Bridge / auxiliary tools (Composer, MCP, scheduler, etc.) ---

export type GrokBridgeToolVariant =
	| 'CursorShell'
	| 'CursorRead'
	| 'CursorGrep'
	| 'CursorStrReplace'
	| 'CursorWrite'
	| 'CursorGlob'
	| 'CursorWebFetch'
	| 'CursorWebSearch'
	| 'CursorTodoWrite'
	| 'CursorTask'
	| 'CursorAwaitShell'
	| 'CursorListMcpResources'
	| 'UseTool'
	| 'TaskOutput'
	| 'KillTask'
	| 'SchedulerList'
	| 'SearchTool'
	| 'XSearch';

export type GrokBridgeToolRawInput = GrokToolInput<GrokBridgeToolVariant> & Record<string, unknown>;

export type GrokMcpToolRawOutput = {
	type: 'MCP';
	tool_name: string;
	server_name: string;
	output: Record<string, string>;
};

export type GrokTaskOutputToolRawOutput = {
	type: 'TaskOutput';
	Result: {
		task_id: string;
		command: string;
		status: string;
		exit_code: number | null;
		started: string;
		ended: string;
		duration_secs: number;
		output: string;
		output_file: string;
		truncated: boolean;
		truncation_hint?: string;
		raw_output_bytes: number;
	};
};

export type GrokKillTaskToolRawOutput = {
	type: 'KillTask';
	Result: { task_id: string; outcome: string; message: string };
};

export type GrokSchedulerListToolRawOutput = {
	type: 'SchedulerList';
	tasks: unknown[];
};

export type GrokSearchToolRawOutput = {
	type: 'SearchTool';
	result_count: number;
	content: string;
};

export type GrokBridgeToolRawOutput =
	| GrokBashToolRawOutput
	| GrokBackgroundTaskStartedOutput
	| GrokReadFileToolRawOutput
	| GrokListDirToolRawOutput
	| GrokGrepToolRawOutput
	| GrokSearchReplaceToolRawOutput
	| GrokWebSearchToolRawOutput
	| GrokWebFetchToolRawOutput
	| GrokTodoWriteToolRawOutput
	| GrokTextToolRawOutput
	| GrokMcpToolRawOutput
	| GrokTaskOutputToolRawOutput
	| GrokKillTaskToolRawOutput
	| GrokSchedulerListToolRawOutput
	| GrokSearchToolRawOutput;

export type GrokBridgeTool = GrokToolSpec<GrokBridgeToolVariant, GrokBridgeToolRawInput, GrokBridgeToolRawOutput>;

export type GrokTool = GrokNativeTool | GrokBridgeTool | GrokSearchActionTool;

export type GrokToolVariant = GrokTool['variant'];
export type GrokNamedTool = Extract<GrokTool, { variant: string }>;
export type GrokToolByVariant<V extends GrokToolVariant> = Extract<GrokTool, { variant: V }>;
export type GrokToolRawInput = GrokTool['rawInput'];
export type GrokToolRawOutput = GrokTool['rawOutput'];
export type GrokToolRawInputByVariant<V extends GrokToolVariant> = GrokToolByVariant<V>['rawInput'];
export type GrokToolRawOutputByVariant<V extends GrokToolVariant> = GrokToolByVariant<V>['rawOutput'];

type GrokToolCallBase = Omit<AcpToolCall, 'rawInput' | 'rawOutput' | 'sessionUpdate'>;
type GrokToolCallUpdateBase = Omit<AcpToolCallUpdate, 'rawInput' | 'rawOutput' | 'sessionUpdate'>;

export type GrokToolCallOf<T extends GrokTool> = GrokToolCallBase & {
	sessionUpdate: 'tool_call';
	rawInput?: T['rawInput'];
	rawOutput?: T['rawOutput'];
};

export type GrokToolCallUpdateOf<T extends GrokTool> = GrokToolCallUpdateBase & {
	sessionUpdate: 'tool_call_update';
	rawInput?: T['rawInput'];
	rawOutput?: T['rawOutput'];
};

export type GrokToolCall = GrokToolCallOf<GrokTool>;
export type GrokToolCallUpdate = GrokToolCallUpdateOf<GrokTool>;

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

export type GrokMemoryFlushStartedUpdate = { sessionUpdate: 'memory_flush_started' };

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