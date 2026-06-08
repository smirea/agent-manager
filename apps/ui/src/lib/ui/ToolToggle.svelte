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
		<span class="indicator">
			{#if open}◆{:else}›{/if}
		</span>
		<b style:color={open ? 'var(--grok-tool-title)' : null}>{title}</b>
		{#each titleExtra as e}
			<span style:color={open ? e.color : null}>{e.text}</span>
		{/each}
	</div>
	{#if open}
		<div class="content ml-4">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.root {
		position: relative;
	}
	.root[data-open='true']:before {
		position: absolute;
		top: 0;
		left: -1rem;
		bottom: 0;
		width: 4px;
		background: var(--grok-message-toggle-accent);
		content: '';
	}
	.title {
		user-select: none;
		cursor: pointer;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
</style>
