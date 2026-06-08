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
	const todoSummary = (value: Output) =>
		value.type === 'Todo'
			? (value.TodosUpdated?.summary_for_prompt ?? '').replace(/\[in_progress\]/g, '[in progress]')
			: '';

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
</script>

<div {...rest} data-tool-content-type={c.type} class={[cls, 'tool-content']}>
	{#each structuredContent as item}
		<ToolCallContent {item} />
	{/each}

	{#if c.type === 'empty'}
		{#if structuredContent.length === 0}<div class="empty"></div>{/if}
	{:else if c.type === 'Bash'}
		{#if c.description}<div class="description">{c.description}</div>{/if}
		{@const output = promptOutput(c.output_for_prompt) || decodeBytes(c.output)}
		{#if output}<pre class:error={c.exit_code != null && c.exit_code !== 0}>{output}</pre>{/if}
	{:else if c.type === 'BackgroundTaskStarted'}
		<div>{c.status}</div>
		<div>{c.summary}</div>
		<div>task {c.task_id}</div>
		<div>pid {c.pid}</div>
		<div>{c.output_file}</div>
	{:else if c.type === 'ReadFile'}
		<FileText text={c.FileContent.content_concise ?? c.FileContent.content} />
	{:else if c.type === 'ListDir'}
		{#if 'NotFound' in c}
			<div>{c.NotFound}</div>
		{:else}
			<pre>{c.Content.content}</pre>
		{/if}
	{:else if c.type === 'SearchReplace'}
		{#if 'NoMatchesFound' in c}
			<div>{c.NoMatchesFound.message}</div>
		{:else}
			<DiffBlock path={pathBase(c.EditsApplied.absolute_path)} details={c.EditsApplied.edits?.details ?? []} />
		{/if}
	{:else if c.type === 'GrepSearch'}
		{#if c.file_matches?.length}
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
		<Markdown source={c.pre_formatted ?? c.content ?? ''} />
		{#if c.citations?.length}
			<div class="links">
				{#each c.citations as url, index}
					<a href={url} tabindex="-1">[{index + 1}] {url}</a>
				{/each}
			</div>
		{/if}
	{:else if c.type === 'SearchAction'}
		{#if searchSources.length}
			<div class="links">
				{#each searchSources as source}
					<a href={source.url} tabindex="-1">{source.url}</a>
				{/each}
			</div>
		{/if}
	{:else if c.type === 'WebFetch'}
		<Markdown source={c.Content.content ?? ''} />
	{:else if c.type === 'Todo'}
		<pre>{todoSummary(c)}</pre>
	{:else if c.type === 'Text'}
		<pre>{c.text}</pre>
	{:else if c.type === 'MCP'}
		<div>{c.server_name}.{c.tool_name}</div>
		{#each Object.entries(c.output ?? {}) as [key, value]}
			<div class="mcp-output">
				<div>{key}</div>
				<pre>{String(value)}</pre>
			</div>
		{/each}
	{:else if c.type === 'TaskOutput'}
		<div>{c.Result.command}</div>
		{#if c.Result.output}<pre>{c.Result.output}</pre>{/if}
		<div>exit {c.Result.exit_code ?? '?'}</div>
		{#if c.Result.truncated}<div>truncated</div>{/if}
	{:else if c.type === 'KillTask'}
		<div>{c.Result.outcome}</div>
		<div>{c.Result.message}</div>
		<div>task {c.Result.task_id}</div>
	{:else if c.type === 'SchedulerList'}
		{#if c.tasks?.length}
			<pre>{json(c.tasks)}</pre>
		{:else}
			<div class="empty">No scheduled tasks</div>
		{/if}
	{:else if c.type === 'SearchTool'}
		<Markdown source={c.content ?? ''} />
	{:else if c.type === 'XSearchAction'}
		<div>{c.name}</div>
		<div>call {c.call_id}</div>
		<pre>{c.input}</pre>
	{:else if c.type === 'Error'}
		<div>{c.error}</div>
		<pre>{c.message}</pre>
	{:else}
		<div>Unknown output: {c.type}</div>
		<pre>{json(c.value ?? c)}</pre>
	{/if}
</div>

<style>
	.tool-content {
		color: var(--grok-md-text);
		padding-top: 0.25rem;
		margin-bottom: 0.35rem;
		min-width: 0;
	}

	pre {
		margin: 0.35rem 0;
		padding: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		white-space: pre-wrap;
		word-break: break-word;
	}

	pre.error {
		color: var(--grok-tool-error);
	}

	a {
		display: block;
		color: var(--grok-md-text);
		text-decoration: none;
	}

	a:hover {
		color: var(--grok-link-hover);
	}

	.description,
	.empty,
	.path {
		color: var(--grok-text-muted);
	}

	.path {
		word-break: break-word;
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
		margin-left: 0;
	}

	.match {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr);
		column-gap: 0.75rem;
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

	.mcp-output {
		margin: 0.35rem 0;
	}
</style>
