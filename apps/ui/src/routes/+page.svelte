<script lang="ts">
	import { orpc } from '$lib/orpc';
	import ChatContent from '$lib/ui/ChatContent.svelte';
	import PromptInput from '$lib/ui/PromptInput.svelte';
	import compileUpdates from '$lib/utils/compileUpdates';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Action } from 'svelte/action';

	let theme = $state<'light' | 'dark'>('dark');

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.documentElement.dataset.theme = theme;
	});
	const session = createQuery(() =>
		orpc.sessions.get.queryOptions({ input: { id: '019ea7fc-4383-77d2-b76e-6877858ef00c' } }),
	);

	let paddingBottom = $state(0);
	const onResize: Action<HTMLElement> = (node: HTMLElement) => {
		const ro = new ResizeObserver(([e]) => (paddingBottom = e.contentRect.height));
		ro.observe(node);
		return { destroy: () => ro.disconnect() };
	};

	const compiled = $derived(compileUpdates(session.data?.updates ?? []));
</script>

<svelte:head>
	<title>Agent Manager</title>
</svelte:head>

<main class="root" style={`padding-bottom: calc(${paddingBottom}px + 1rem)`}>
	<div class="content">
		<ChatContent {compiled} />
	</div>

	<div use:onResize class="input">
		<PromptInput autofocus />
	</div>
</main>

<style>
	.root {
		padding: 1rem 0;
		width: 100%;
		min-height: 100vh;
		overflow: hidden;
	}

	.input {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.125rem 1rem 1rem 1rem;
		background-color: var(--grok-surface-overlay);
	}
	.input:focus-within {
		background-color: var(--grok-app-bg);
	}
</style>
