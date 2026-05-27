<script lang="ts">
	import { orpc } from '$lib/orpc';
	import PromptInput from '$lib/ui/PromptInput.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Action } from 'svelte/action';

	let theme = $state<'light' | 'dark'>('light');
	const sessions = createQuery(() => orpc.sessions.list.queryOptions());

	let paddingBottom = $state(0);
	const onResize: Action<HTMLElement> = (node: HTMLElement) => {
		const ro = new ResizeObserver(([entry]) => (paddingBottom = entry.contentRect.height));
		ro.observe(node);
		return { destroy: () => ro.disconnect() };
	};
</script>

<svelte:head>
	<title>Agent Manager</title>
</svelte:head>

<main data-theme={theme} class="root min-h-screen" style={`padding-bottom: calc(${paddingBottom}px + 1rem)`}>
	<div class="content mb-2">{'content '.repeat(1000)}</div>

	<div use:onResize class="input">
		<PromptInput autofocus />
	</div>
</main>

<style>
	.root {
		--bg: var(--theme-g-app-bg);
		--text: var(--theme-g-text);
		display: grid;
		grid-template-columns: auto;
		grid-template-rows: auto max-content;
		padding: 1rem;
		background: var(--bg);
		color: var(--text);
	}

	.input {
		position: fixed;
		left: 1rem;
		right: 1rem;
		bottom: 0;
		padding-bottom: 1rem;
		background-color: oklch(from var(--bg) l c h / 0.9);
	}
	.input:focus-within {
		background-color: var(--bg);
	}
</style>
