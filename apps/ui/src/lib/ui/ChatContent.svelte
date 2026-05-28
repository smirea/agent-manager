<script lang="ts">
	import compileUpdates from '$lib/utils/compileUpdates';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import type { Snippet } from 'svelte';

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
								<SvelteMarkdown source={c.text} />
							{/snippet}
							<div data-thinking>
								{@render toggleable(`${itemIndex}-${contentIndex}`, title, children)}
							</div>
						{:else}
							<SvelteMarkdown source={c.text} />
						{/if}
					{:else if c.type === 'tool'}
						<div class="flex gap-2" data-thinking>
							<!-- <div data-tool-status={c.status}>◆</div> -->
							<div>
								{#if c.rawInput?.variant === 'ListDir'}
									<b>List</b> {c.rawInput.target_directory}
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
									<b style:color="red">(TODO)</b>{c.title}
									<pre>rawInput = {JSON.stringify(c.rawInput)}</pre>
									<pre>{JSON.stringify(c)}</pre>
								{/if}
							</div>
						</div>
					{:else}
						<div style:color="red">todo: {c.type}</div>
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
		background: var(--theme-g-bg-code);
		color: var(--theme-g-text);
	}
	.message[data-role='clanker'] {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}
	[data-thinking] {
		color: var(--theme-g-text-thinking);
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
		background: var(--theme-g-text-thinking);
		content: '';
	}
	[data-open='true'] .toggle-indicator:before {
		content: '◆';
	}
	[data-open='false'] .toggle-title-label .toggle-indicator:before {
		content: '›';
	}
</style>
