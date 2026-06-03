<script lang="ts">
	import compileUpdates from '$lib/utils/compileUpdates';
	import type { Snippet } from 'svelte';
	import Markdown from './Markdown.svelte';

	const { compiled, ...rest }: { compiled: ReturnType<typeof compileUpdates> } = $props();
	type ToggleId = `${number}-${number}`;
	const open = $state({} as Record<ToggleId, boolean>);
</script>

{#snippet toggleable(id: ToggleId, title: Snippet, children: Snippet)}
	<div data-open={!!open[id]} class="relative">
		<div class="toggle-title-row">
			<span class="toggle-title-label select-none cursor-pointer" onclick={() => (open[id] = !open[id])}>
				<span class="toggle-indicator"></span>
				{@render title()}
			</span>
		</div>
		{#if open[id]}
			<div class="pl-4">
				{@render children()}
			</div>
		{/if}
	</div>
{/snippet}

{#each compiled.chat as item, itemIndex}
	<div class="message" data-role={item.role}>
		{#if item.role === 'user'}
			{item.text}
		{:else}
			{#each item.content as c, contentIndex}
				<div data-content-type={c.type}>
					{#if c.type === 'text'}
						{#if c.thinking}
							{#snippet title()}
								<b>Thought</b>
								{c.thinkingDurationSec ? `for ${c.thinkingDurationSec}s` : 'for a bit'}
							{/snippet}
							{#snippet children()}
								<Markdown source={c.text} />
							{/snippet}
							<div data-thinking>
								{@render toggleable(`${itemIndex}-${contentIndex}`, title, children)}
							</div>
						{:else}
							<Markdown source={c.text} />
						{/if}
					{:else if c.type === 'tool'}
						<div class="tool" data-thinking>
							<div>
								{#if c.rawInput?.variant === 'ListDir'}
									{#snippet title()}
										<b>List</b> {(c.rawInput as any)?.target_directory}
									{/snippet}
									{#snippet children()}
										<pre>{(c.rawOutput as any).Content.content}</pre>
									{/snippet}
									{@render toggleable(`${itemIndex}-${contentIndex}`, title, children)}
								{:else if c.rawInput?.variant === 'ReadFile'}
									{#snippet title()}
										<b>Read</b>
										{(c.rawInput as any)?.target_file}
									{/snippet}
									{#snippet children()}
										<pre>{(c.rawOutput as any).FileContent.content}</pre>
									{/snippet}
									{@render toggleable(`${itemIndex}-${contentIndex}`, title, children)}
								{:else}
									<b class="todo">(TODO)</b>{c.title}
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

	.tool b,
	[data-thinking] b {
		color: var(--grok-tool-title);
		font-weight: bold;
	}

	.tool :global(.toggle-title-label),
	[data-thinking] :global(.toggle-title-label) {
		color: var(--grok-md-text);
	}

	.todo {
		color: var(--grok-accent-error);
	}

	.toggle-indicator:before {
		content: '◆';
	}

	[data-open='true'] .toggle-title-row:before {
		position: absolute;
		top: 0;
		left: -1rem;
		bottom: 0;
		width: 4px;
		background: var(--grok-message-toggle-accent);
		content: '';
	}

	[data-open='true'] .toggle-indicator:before {
		content: '◆';
	}

	[data-open='false'] .toggle-title-label .toggle-indicator:before {
		content: '›';
	}
</style>