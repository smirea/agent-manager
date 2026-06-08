<script lang="ts">
	import compileUpdates from '$lib/utils/compileUpdates';
	import ContentBlock from './ContentBlock.svelte';
	import Markdown from './Markdown.svelte';
	import ToolContent from './ToolContent.svelte';
	import ToolToggle from './ToolToggle.svelte';

	const { compiled, ...rest }: { compiled: ReturnType<typeof compileUpdates> } = $props();
	type ToggleId = `${number}-${number}`;
	const open = $state({} as Record<ToggleId, boolean>);

	const toggleProps = (a: number, b: number) => {
		const id = `${a}-${b}` as const;
		return { open: !!open[id], onChange: (v: boolean) => (open[id] = !open[id]) };
	};

	type TitleExtra = { text: string; color?: string };

	const extra = (...items: Array<TitleExtra | null | undefined>) =>
		items.filter((item): item is TitleExtra => !!item?.text);
	const rawOutput = (tool: any) => (tool.rawOutput && typeof tool.rawOutput === 'object' ? tool.rawOutput : null);
	const sourceCount = (out: any) => out?.action?.sources?.length ?? out?.citations?.length ?? out?.result_count;
	const statusExtra = (tool: any, out: any) => {
		if (tool.status === 'failed') return { text: 'failed', color: 'var(--grok-tool-error)' };
		if (out?.exit_code != null && out.exit_code !== 0)
			return { text: `exit ${out.exit_code}`, color: 'var(--grok-tool-error)' };
		if (out?.timed_out) return { text: 'timed out', color: 'var(--grok-warning)' };
		if (out?.truncated || out?.Result?.truncated) return { text: 'truncated', color: 'var(--grok-warning)' };
		return null;
	};

	const toolSummary = (tool: any): { title: string; titleExtra: TitleExtra[] } => {
		const input = tool.rawInput ?? {};
		const out = rawOutput(tool);
		const variant = input.variant;
		const status = statusExtra(tool, out);
		const path = input.target_file ?? input.path ?? input.file_path ?? input.filePath ?? input.target_directory;
		const command = input.command ?? out?.command;
		const query = input.query ?? out?.query ?? out?.action?.query;
		const count = sourceCount(out);

		switch (variant) {
			case 'ListDir':
				return { title: 'List', titleExtra: extra({ text: input.target_directory ?? path }, status) };
			case 'ReadFile':
			case 'CursorRead':
				return { title: 'Read', titleExtra: extra({ text: path }, status) };
			case 'Bash':
			case 'CursorShell':
				return {
					title: out?.type === 'BackgroundTaskStarted' ? 'Background' : 'Run',
					titleExtra: extra({ text: command, color: 'var(--grok-tool-system)' }, status),
				};
			case 'Grep':
			case 'CursorGrep':
				return {
					title: 'Search',
					titleExtra: extra(
						{ text: input.pattern ? `"${input.pattern}"` : query, color: 'var(--grok-tool-success)' },
						{ text: input.path ?? input.glob ?? '' },
						count != null ? { text: `${count} ${count === 1 ? 'match' : 'matches'}` } : null,
						status,
					),
				};
			case 'CursorGlob':
				return {
					title: 'Glob',
					titleExtra: extra(
						{ text: input.glob_pattern ?? input.glob },
						count != null ? { text: `${count} files` } : null,
						status,
					),
				};
			case 'SearchReplace':
			case 'CursorStrReplace':
				return { title: out?.NoMatchesFound ? 'No edits' : 'Edited', titleExtra: extra({ text: path }, status) };
			case 'Write':
			case 'CursorWrite':
				return {
					title: out?.EditsApplied?.old_string ? 'Edited' : 'Creating',
					titleExtra: extra({ text: path }, status),
				};
			case 'TodoWrite':
			case 'CursorTodoWrite':
				return { title: 'Updated plan', titleExtra: extra(status) };
			case 'WebSearch':
			case 'CursorWebSearch':
				return {
					title: 'Web Search',
					titleExtra: extra(
						{ text: query || (input.backend ? 'server-side' : ''), color: 'var(--grok-tool-system)' },
						count != null ? { text: `${count} ${count === 1 ? 'site' : 'sites'}` } : null,
						status,
					),
				};
			case 'XSearch':
				return {
					title: 'X Search',
					titleExtra: extra({ text: query ?? out?.name ?? 'server-side', color: 'var(--grok-tool-system)' }, status),
				};
			case 'WebFetch':
			case 'CursorWebFetch':
				return {
					title: 'Fetch',
					titleExtra: extra({ text: input.url ?? out?.Content?.url, color: 'var(--grok-tool-system)' }, status),
				};
			case 'CursorAwaitShell':
				return { title: 'Await', titleExtra: extra({ text: input.pattern ?? input.shell_id }, status) };
			case 'CursorTask':
				return { title: 'Task', titleExtra: extra({ text: input.description ?? input.prompt ?? tool.title }, status) };
			case 'CursorListMcpResources':
				return { title: 'MCP Resources', titleExtra: extra({ text: input.server }, status) };
			case 'UseTool':
				return {
					title: 'MCP',
					titleExtra: extra({ text: input.tool_name ?? out?.tool_name, color: 'var(--grok-tool-skill)' }, status),
				};
			case 'TaskOutput':
				return { title: 'Task Output', titleExtra: extra({ text: input.task_id ?? out?.Result?.task_id }, status) };
			case 'KillTask':
				return { title: 'Kill Task', titleExtra: extra({ text: input.task_id ?? out?.Result?.task_id }, status) };
			case 'SchedulerList':
				return { title: 'Scheduler', titleExtra: extra(count != null ? { text: `${count} tasks` } : null, status) };
			case 'SearchTool':
				return {
					title: 'Search',
					titleExtra: extra(
						{ text: query ?? tool.title, color: 'var(--grok-tool-success)' },
						count != null ? { text: `${count} results` } : null,
						status,
					),
				};
			default:
				if (out?.action?.type === 'search') {
					return {
						title: 'Web Search',
						titleExtra: extra(
							{ text: out.action.query, color: 'var(--grok-tool-system)' },
							count != null ? { text: `${count} sites` } : null,
							status,
						),
					};
				}
				return {
					title: tool.title ?? variant ?? 'Tool',
					titleExtra: extra(variant ? { text: variant } : null, status),
				};
		}
	};
</script>

{#each compiled.chat as item, itemIndex}
	<div class="message" data-role={item.role}>
		{#if item.role === 'user'}
			{#each item.content as content}
				<ContentBlock {content} />
			{/each}
		{:else}
			{#each item.content as c, contentIndex}
				<div data-content-type={c.type}>
					{#if c.type === 'text'}
						{#if c.thinking}
							<div data-thinking>
								<ToolToggle
									title="Thought"
									titleExtra={[{ text: c.thinkingDurationSec ? `for ${c.thinkingDurationSec}s` : 'for a bit' }]}
									{...toggleProps(itemIndex, contentIndex)}
								>
									<Markdown source={c.text} />
								</ToolToggle>
							</div>
						{:else}
							<Markdown source={c.text} />
						{/if}
					{:else if c.type === 'tool'}
						{@const summary = toolSummary(c)}
						<div class="tool">
							<div>
								<ToolToggle
									title={summary.title}
									titleExtra={summary.titleExtra}
									{...toggleProps(itemIndex, contentIndex)}
								>
									<ToolContent tool={c} />
								</ToolToggle>
							</div>
						</div>
					{:else}
						<ContentBlock content={c} />
					{/if}
				</div>
			{/each}
		{/if}
	</div>
{/each}

<style>
	.message {
		padding: 0 1rem;
	}

	.message[data-role='user'] {
		background: var(--grok-message-user-bg);
		color: var(--grok-message-user-text);
		margin: 1rem 0;
		font-size: var(--text-s);
	}

	.message[data-role='clanker'] {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: 1.45;
		color: var(--grok-md-text);
	}

	.tool,
	[data-thinking] {
		color: var(--grok-message-thinking-text);
	}
</style>
