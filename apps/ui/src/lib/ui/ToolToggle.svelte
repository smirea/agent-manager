<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		open,
		onChange,
		children,
		title,
		titleExtra,
		class: cls,
		...rest
	}: {
		open: boolean;
		onChange: (value: boolean) => void;
		title: string;
		titleExtra?: Array<{ text: string; color?: string }>;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div {...rest} data-open={!!open} class={['root', cls]}>
	<div class="title" onclick={() => onChange(!open)}>
		<span class="indicator">◆</span>
		<b style:color={open ? 'var(--grok-tool-title)' : null}>{title}</b>
		{#each titleExtra as e}
			<span style:color={open ? e.color : null}>{e.text}</span>
		{/each}
	</div>
	{#if open}
		<div class="content">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.root {
		position: relative;
		margin: 0.1rem 0;
	}

	.root[data-open='true'] {
		margin-left: -0.65rem;
		padding-left: 0.55rem;
		border-left: 1px solid var(--grok-message-toggle-accent);
	}

	.title {
		user-select: none;
		cursor: pointer;
		display: flex;
		gap: 0.35rem;
		align-items: center;
		flex-wrap: wrap;
		min-height: 1.45em;
		color: var(--grok-message-thinking-text);
	}

	.indicator {
		color: var(--grok-message-thinking-text);
	}

	.content {
		padding-left: 1rem;
	}
</style>
