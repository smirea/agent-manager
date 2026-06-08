import type {
	GrokBashTool,
	GrokGrepTool,
	GrokListDirTool,
	GrokListDirToolRawOutput,
	GrokReadFileTool,
	GrokSearchReplaceTool,
	GrokTodoWriteTool,
	GrokWebFetchTool,
	GrokWebSearchTool,
	GrokWriteTool,
} from '@repo/shared';
import type { CompiledTool, CompiledToolOf } from './compileUpdates';

export type { CompiledTool, CompiledToolOf };

export const isBashTool = (tool: CompiledTool): tool is CompiledToolOf<GrokBashTool> => tool.variant === 'Bash';

export const isReadFileTool = (tool: CompiledTool): tool is CompiledToolOf<GrokReadFileTool> =>
	tool.variant === 'ReadFile';

export const isListDirTool = (tool: CompiledTool): tool is CompiledToolOf<GrokListDirTool> =>
	tool.variant === 'ListDir';

export const isGrepTool = (tool: CompiledTool): tool is CompiledToolOf<GrokGrepTool> => tool.variant === 'Grep';

export const isSearchReplaceTool = (tool: CompiledTool): tool is CompiledToolOf<GrokSearchReplaceTool> =>
	tool.variant === 'SearchReplace';

export const isWebSearchTool = (tool: CompiledTool): tool is CompiledToolOf<GrokWebSearchTool> =>
	tool.variant === 'WebSearch';

export const isWebFetchTool = (tool: CompiledTool): tool is CompiledToolOf<GrokWebFetchTool> =>
	tool.variant === 'WebFetch';

export const isTodoWriteTool = (tool: CompiledTool): tool is CompiledToolOf<GrokTodoWriteTool> =>
	tool.variant === 'TodoWrite';

export const isWriteTool = (tool: CompiledTool): tool is CompiledToolOf<GrokWriteTool> => tool.variant === 'Write';

export const isListDirContent = (
	output: GrokListDirToolRawOutput | undefined,
): output is Extract<GrokListDirToolRawOutput, { Content: unknown }> => !!output && 'Content' in output;

export const isListDirNotFound = (
	output: GrokListDirToolRawOutput | undefined,
): output is Extract<GrokListDirToolRawOutput, { NotFound: string }> => !!output && 'NotFound' in output;
