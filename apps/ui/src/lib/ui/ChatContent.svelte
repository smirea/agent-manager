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
	const backtick = (value?: string | null) => (value ?? '').replace(/^`|`$/g, '');
	const displayPath = (value?: string | null) => backtick(value)?.replace(/^.*\/([^/]+)$/, '$1');
	const thinkingSource = (value: string) => value.replace(/[<>]/g, match => `\\${match}`);

	const toolSummary = (tool: any): { title: string; titleExtra: TitleExtra[] } => {
		const input = tool.rawInput ?? {};
		const out = rawOutput(tool);
		const variant = input.variant;
		const path = input.target_file ?? input.path ?? input.file_path ?? input.filePath ?? input.target_directory;
		const command = input.command ?? out?.command;
		const query = input.query ?? out?.query ?? out?.action?.query;
		const count = sourceCount(out);

		switch (variant) {
			case 'ListDir':
				return { title: 'List', titleExtra: extra({ text: input.target_directory ?? path }) };
			case 'ReadFile':
			case 'CursorRead':
				return { title: 'Read', titleExtra: extra({ text: displayPath(path) }) };
			case 'Bash':
			case 'CursorShell':
				return {
					title: out?.type === 'BackgroundTaskStarted' ? 'Background' : 'Run',
					titleExtra: extra({ text: command }),
				};
			case 'Grep':
			case 'CursorGrep':
				return {
					title: 'Search',
					titleExtra: extra(
						{ text: input.pattern ? `"${input.pattern}"` : query },
						{ text: input.path ? `in ${input.path}` : (input.glob ?? '') },
						count != null ? { text: `(${count} ${count === 1 ? 'match' : 'matches'})` } : null,
					),
				};
			case 'CursorGlob':
				return {
					title: 'Glob',
					titleExtra: extra(
						{ text: input.glob_pattern ?? input.glob },
						count != null ? { text: `(${count} files)` } : null,
					),
				};
			case 'SearchReplace':
			case 'CursorStrReplace':
				return { title: out?.NoMatchesFound ? 'No edits' : 'Edit', titleExtra: extra({ text: displayPath(path) }) };
			case 'Write':
			case 'CursorWrite':
				return {
					title: out?.EditsApplied?.old_string ? 'Edit' : 'Creating',
					titleExtra: extra({ text: displayPath(input.filePath ?? path) }),
				};
			case 'TodoWrite':
			case 'CursorTodoWrite':
				return { title: tool.status === 'completed' ? 'Updated plan' : 'Updating plan', titleExtra: [] };
			case 'WebSearch':
			case 'CursorWebSearch':
				return {
					title: 'Web Search',
					titleExtra: extra(
						{ text: query || (input.backend ? 'server-side' : '') },
						count != null ? { text: `(${count} ${count === 1 ? 'site' : 'sites'})` } : null,
					),
				};
			case 'XSearch':
				return {
					title: 'X Search',
					titleExtra: extra({ text: query ?? out?.name ?? 'server-side' }),
				};
			case 'WebFetch':
			case 'CursorWebFetch':
				return {
					title: 'Fetch',
					titleExtra: extra({ text: input.url ?? out?.Content?.url }),
				};
			case 'CursorAwaitShell':
				return { title: 'Await', titleExtra: extra({ text: input.pattern ?? input.shell_id }) };
			case 'CursorTask':
				return { title: 'Task', titleExtra: extra({ text: input.description ?? input.prompt ?? tool.title }) };
			case 'CursorListMcpResources':
				return { title: 'MCP Resources', titleExtra: extra({ text: input.server }) };
			case 'UseTool':
				return {
					title: 'MCP',
					titleExtra: extra({ text: input.tool_name ?? out?.tool_name }),
				};
			case 'TaskOutput':
				return { title: 'Task Output', titleExtra: extra({ text: input.task_id ?? out?.Result?.task_id }) };
			case 'KillTask':
				return { title: 'Kill Task', titleExtra: extra({ text: input.task_id ?? out?.Result?.task_id }) };
			case 'SchedulerList':
				return { title: 'Scheduler', titleExtra: extra(count != null ? { text: `(${count} tasks)` } : null) };
			case 'SearchTool':
				return {
					title: 'Search',
					titleExtra: extra({ text: query ?? tool.title }, count != null ? { text: `(${count} results)` } : null),
				};
			default:
				if (out?.action?.type === 'search') {
					return {
						title: 'Web Search',
						titleExtra: extra(
							{ text: out.action.query },
							count != null ? { text: `(${count} ${count === 1 ? 'site' : 'sites'})` } : null,
						),
					};
				}
				return {
					title: tool.title ?? variant ?? 'Tool',
					titleExtra: extra(variant ? { text: variant } : null),
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
									<Markdown source={thinkingSource(c.text)} />
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
