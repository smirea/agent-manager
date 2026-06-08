<script lang="ts">
	import type { ClankerContent } from '$lib/utils/compileUpdates';
	import DiffBlock from './DiffBlock.svelte';
	import FileText from './FileText.svelte';
	import Markdown from './Markdown.svelte';
	import ToolCallContent from './ToolCallContent.svelte';

	const { tool, class: cls, ...rest }: { class?: string; tool: ClankerContent & { type: 'tool' } } = $props();

	type Output = { type: string; [key: string]: any };

	const decoder = new TextDecoder();
	const decodeBytes = (bytes?: number[] | null) => (bytes?.length ? decoder.decode(new Uint8Array(bytes)) : '');
	const json = (value: unknown) => JSON.stringify(value, null, 2);
	const promptOutput = (value?: string) => (value ?? '').replace(/^exit:\s*[^\n]*\n?/, '');
	const pathBase = (value?: string | null) => value?.split('/').filter(Boolean).at(-1) ?? '';

	const normalize = (value: unknown): Output => {
		if (!value) return { type: 'empty' };
		if (typeof value !== 'object') return { type: 'Unknown', value };
		if ('type' in value && typeof (value as { type?: unknown }).type === 'string') return value as Output;
		if ('action' in value && 'status' in value) return { type: 'SearchAction', ...(value as object) };
		if ('error' in value && 'message' in value) return { type: 'Error', ...(value as object) };
		if ('call_id' in value && 'input' in value && 'name' in value)
			return { type: 'XSearchAction', ...(value as object) };
		return { type: 'Unknown', value };
	};

	const out = $derived(tool.rawOutput);
	const c = $derived(normalize(out));
	const structuredContent = $derived(
		(tool.content ?? []).filter(item => item.type !== 'content' || c.type === 'empty' || c.type === 'Unknown'),
	);
	const searchSources = $derived(c.type === 'SearchAction' ? (c.action?.sources ?? []) : []);
	const todoItems = $derived(
		c.type === 'Todo' ? (c.TodosUpdated?.todos ?? Object.values(c.TodosUpdated?.state?.todos ?? {})) : [],
	);
</script>

<div {...rest} data-tool-content-type={c.type} class={[cls, 'tool-content']}>
	{#each structuredContent as item}
		<ToolCallContent {item} />
	{/each}

	{#if c.type === 'empty'}
		{#if structuredContent.length === 0}<div class="empty"></div>{/if}
	{:else if c.type === 'Bash'}
		{#if c.description}<div class="description">{c.description}</div>{/if}
		<pre class:error={c.exit_code != null && c.exit_code !== 0}>{promptOutput(c.output_for_prompt) ||
				decodeBytes(c.output) ||
				'(no output)'}</pre>
		<div class="meta">
			<span class:ok={c.exit_code === 0} class:error={c.exit_code != null && c.exit_code !== 0}
				>exit {c.exit_code ?? '?'}</span
			>
			<span>{c.current_dir}</span>
			{#if c.truncated}<span class="warning">truncated</span>{/if}
			{#if c.timed_out}<span class="warning">timed out</span>{/if}
		</div>
	{:else if c.type === 'BackgroundTaskStarted'}
		<div class="status running">{c.status}</div>
		<div>{c.summary}</div>
		<div class="kv"><span>task</span><span>{c.task_id}</span></div>
		<div class="kv"><span>pid</span><span>{c.pid}</span></div>
		<div class="kv"><span>output</span><span>{c.output_file}</span></div>
	{:else if c.type === 'ReadFile'}
		<div class="path">{c.FileContent.absolute_path}</div>
		<FileText text={c.FileContent.content_concise ?? c.FileContent.content} />
	{:else if c.type === 'ListDir'}
		{#if 'NotFound' in c}
			<div class="status error">{c.NotFound}</div>
		{:else}
			<div class="path">{c.Content.absolute_root_path}</div>
			<pre>{c.Content.content}</pre>
		{/if}
	{:else if c.type === 'SearchReplace'}
		{#if 'NoMatchesFound' in c}
			<div class="status warning">{c.NoMatchesFound.message}</div>
			<div class="path">{c.NoMatchesFound.file_path}</div>
		{:else}
			<div class="path">{c.EditsApplied.absolute_path}</div>
			<div class="description">
				{c.EditsApplied.tool_output_for_prompt_concise ?? c.EditsApplied.tool_output_for_prompt}
			</div>
			<DiffBlock path={pathBase(c.EditsApplied.absolute_path)} details={c.EditsApplied.edits?.details ?? []} />
		{/if}
	{:else if c.type === 'GrepSearch'}
		{#if c.file_matches?.length}
			<div class="description">{c.match_count} {c.match_count === 1 ? 'match' : 'matches'}</div>
			{#each c.file_matches as file}
				<div class="match-file">
					<div class="path">{file.path}</div>
					<div class="matches">
						{#each file.matches as match}
							<div class="match">
								<span>{match.line_number}</span>
								<span>{match.content}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<div class="empty">No matches</div>
			{#if decodeBytes(c.stdout)}<pre>{decodeBytes(c.stdout)}</pre>{/if}
		{/if}
	{:else if c.type === 'WebSearch'}
		<div class="path">{c.query}</div>
		<Markdown source={c.pre_formatted ?? c.content ?? ''} />
		{#if c.citations?.length}
			<div class="links">
				{#each c.citations as url, index}
					<a href={url} tabindex="-1">[{index + 1}] {url}</a>
				{/each}
			</div>
		{/if}
	{:else if c.type === 'SearchAction'}
		<div class="path">{c.action?.query ?? c.action?.url ?? c.action?.type}</div>
		<div class="status ok">{c.status}</div>
		{#if searchSources.length}
			<div class="links">
				{#each searchSources as source}
					<a href={source.url} tabindex="-1">{source.url}</a>
				{/each}
			</div>
		{/if}
	{:else if c.type === 'WebFetch'}
		<div class="path">{c.Content.url}</div>
		<div class="meta">
			<span>{c.Content.status_code}</span>
			<span>{c.Content.content_type}</span>
			<span>{c.Content.bytes} bytes</span>
		</div>
		<Markdown source={c.Content.content ?? ''} />
	{:else if c.type === 'Todo'}
		<div class="todos">
			{#each todoItems as todo}
				<div class="todo" data-status={todo.status}>
					<span>{todo.status}</span>
					<span>{todo.content}</span>
				</div>
			{/each}
		</div>
	{:else if c.type === 'Text'}
		<pre>{c.text}</pre>
	{:else if c.type === 'MCP'}
		<div class="path">{c.server_name}.{c.tool_name}</div>
		{#each Object.entries(c.output ?? {}) as [key, value]}
			<div class="mcp-output">
				<div class="meta-key">{key}</div>
				<pre>{String(value)}</pre>
			</div>
		{/each}
	{:else if c.type === 'TaskOutput'}
		<div class="status" class:ok={c.Result.status === 'completed'} class:error={c.Result.status === 'failed'}>
			{c.Result.status}
		</div>
		<div class="path">{c.Result.command}</div>
		<div class="meta">
			<span>exit {c.Result.exit_code ?? '?'}</span>
			<span>{Math.round(c.Result.duration_secs * 10) / 10}s</span>
			{#if c.Result.truncated}<span class="warning">truncated</span>{/if}
		</div>
		<pre>{c.Result.output || '(no output)'}</pre>
		<div class="kv"><span>output</span><span>{c.Result.output_file}</span></div>
	{:else if c.type === 'KillTask'}
		<div class="status">{c.Result.outcome}</div>
		<div>{c.Result.message}</div>
		<div class="kv"><span>task</span><span>{c.Result.task_id}</span></div>
	{:else if c.type === 'SchedulerList'}
		{#if c.tasks?.length}
			<pre>{json(c.tasks)}</pre>
		{:else}
			<div class="empty">No scheduled tasks</div>
		{/if}
	{:else if c.type === 'SearchTool'}
		<div class="description">{c.result_count} results</div>
		<Markdown source={c.content ?? ''} />
	{:else if c.type === 'XSearchAction'}
		<div class="path">{c.name}</div>
		<div class="kv"><span>call</span><span>{c.call_id}</span></div>
		<pre>{c.input}</pre>
	{:else if c.type === 'Error'}
		<div class="status error">{c.error}</div>
		<pre>{c.message}</pre>
	{:else}
		<div class="status warning">Unknown output: {c.type}</div>
		<pre>{json(c.value ?? c)}</pre>
	{/if}
</div>

<style>
	.tool-content {
		color: var(--grok-message-thinking-text);
		padding-top: 0.25rem;
		margin-bottom: 0.5rem;
		min-width: 0;
	}

	pre {
		margin: 0.35rem 0;
		padding: 0.4rem 0.65rem;
		background: var(--grok-pre-bg);
		color: var(--grok-pre-fg);
		white-space: pre-wrap;
		word-break: break-word;
	}

	pre.error {
		color: var(--grok-tool-error);
	}

	a {
		display: block;
		color: var(--grok-md-link);
		text-decoration: none;
	}

	a:hover {
		color: var(--grok-link-hover);
	}

	.description,
	.empty,
	.meta,
	.kv,
	.meta-key {
		color: var(--grok-text-muted);
	}

	.path {
		color: var(--grok-path);
		font-weight: bold;
		word-break: break-word;
	}

	.meta,
	.kv {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: var(--text-xs);
	}

	.kv span:first-child,
	.meta-key {
		color: var(--grok-diff-gutter-fg);
	}

	.status {
		color: var(--grok-tool-system);
	}

	.ok,
	.status.ok {
		color: var(--grok-tool-success);
	}

	.error,
	.status.error {
		color: var(--grok-tool-error);
	}

	.warning,
	.status.warning {
		color: var(--grok-warning);
	}

	.running {
		color: var(--grok-tool-running);
	}

	.match-file {
		margin: 0.35rem 0;
	}

	.matches {
		margin-left: 1rem;
	}

	.match {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr);
		column-gap: 0.75rem;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.match span:first-child {
		color: var(--grok-diff-gutter-fg);
		text-align: right;
		user-select: none;
	}

	.match span:last-child {
		color: var(--grok-md-text);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.links {
		margin-top: 0.35rem;
	}

	.todo {
		display: grid;
		grid-template-columns: 7.5rem minmax(0, 1fr);
		gap: 0.75rem;
	}

	.todo span:first-child {
		color: var(--grok-text-muted);
	}

	.todo[data-status='completed'] span:first-child {
		color: var(--grok-tool-success);
	}

	.todo[data-status='in_progress'] span:first-child {
		color: var(--grok-tool-running);
	}

	.todo[data-status='cancelled'] span:first-child,
	.todo[data-status='failed'] span:first-child {
		color: var(--grok-tool-error);
	}

	.mcp-output {
		margin: 0.35rem 0;
	}
</style>
