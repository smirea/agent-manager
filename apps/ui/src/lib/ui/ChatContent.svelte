<script lang="ts">
	import compileUpdates from '$lib/utils/compileUpdates';
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
</script>

{#each compiled.chat as item, itemIndex}
	<div class="message" data-role={item.role}>
		{#if item.role === 'user'}
			{item.text}
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
						<div class="tool">
							<div>
								{#if !c.rawInput?.variant}
									<b class="todo">TODO: no variant</b>
								{:else if c.rawInput.variant === 'ListDir'}
									<ToolToggle
										title="List"
										titleExtra={[{ text: (c.rawInput as any).target_directory }]}
										{...toggleProps(itemIndex, contentIndex)}
									>
										<ToolContent tool={c} />
									</ToolToggle>
								{:else if c.rawInput.variant === 'ReadFile'}
									<ToolToggle
										title="Read"
										titleExtra={[{ text: (c.rawInput as any)?.target_file }]}
										{...toggleProps(itemIndex, contentIndex)}
									>
										<ToolContent tool={c} />
									</ToolToggle>
								{:else if c.rawInput.variant === 'Bash'}
									<ToolToggle
										title="Run"
										titleExtra={[{ text: c.rawInput.command, color: 'var(--grok-tool-system)' }]}
										{...toggleProps(itemIndex, contentIndex)}
									>
										<ToolContent tool={c} />
									</ToolToggle>
								{:else if c.rawInput.variant === 'Grep'}
									<ToolToggle
										title="Search"
										titleExtra={[{ text: `"${c.rawInput.pattern}"`, color: 'var(--grok-tool-success)' }]}
										{...toggleProps(itemIndex, contentIndex)}
									>
										<ToolContent tool={c} />
									</ToolToggle>
								{:else if c.rawInput.variant === 'SearchReplace'}
									<ToolToggle
										title="Edited"
										titleExtra={[{ text: c.rawInput.file_path }]}
										{...toggleProps(itemIndex, contentIndex)}
									>
										<ToolContent tool={c} />
									</ToolToggle>
								{:else if c.rawInput.variant === 'TodoWrite'}
									<div class="todo">todo: TodoWrite</div>
								{:else}
									<b class="todo">(TODO: variant={c.rawInput.variant})</b>{c.title}
									<pre>rawInput = {JSON.stringify(c.rawInput)}</pre>
									<pre>{JSON.stringify(c)}</pre>
								{/if}
							</div>
						</div>
					{:else}
						<div class="todo">todo: {c.type}</div>
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

	.message[data-role='clanker'] pre {
		padding: 0.5rem 0.75rem;
		background: var(--grok-pre-bg);
		color: var(--grok-pre-fg);
	}

	.tool,
	[data-thinking] {
		color: var(--grok-message-thinking-text);
	}

	.todo {
		color: var(--grok-accent-error);
	}
</style>
