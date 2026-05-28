<script lang="ts">
	import { orpc } from '$lib/orpc';
	import ChatContent from '$lib/ui/ChatContent.svelte';
	import PromptInput from '$lib/ui/PromptInput.svelte';
	import compileUpdates from '$lib/utils/compileUpdates';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Action } from 'svelte/action';

	let theme = $state<'light' | 'dark'>('light');
	const sessions = createQuery(() => orpc.sessions.list.queryOptions());
	const session = createQuery(() =>
		orpc.sessions.get.queryOptions({ input: { id: '019e6589-0669-7673-b81b-f6feaecd6c36' } }),
	);

	let paddingBottom = $state(0);
	const onResize: Action<HTMLElement> = (node: HTMLElement) => {
		const ro = new ResizeObserver(([e]) => (paddingBottom = e.contentRect.height));
		ro.observe(node);
		return { destroy: () => ro.disconnect() };
	};

	const expanded = $state({} as Record<string, boolean>);
	const compiled = $derived(compileUpdates(session.data?.updates ?? []));
</script>

<svelte:head>
	<title>Agent Manager</title>
</svelte:head>

<main data-theme={theme} class="root" style={`padding-bottom: calc(${paddingBottom}px + 1rem)`}>
	<div class="content mb-2 text-sm">
		<ChatContent {compiled} />
		<!-- <pre>{JSON.stringify(compiled, null, 4)}</pre> -->
		<hr />
		{#each compiled.list as update, index}
			<div>
				<div onclick={() => (expanded[index] = !expanded[index])}>
					<b>{update.sessionUpdate}</b>:
					{Object.keys(update)
						.filter(x => x !== 'sessionUpdate')
						.join('; ')}
				</div>
				{#if expanded[index]}
					<pre class="pl-4 text-xs">{JSON.stringify(update, null, 4)}</pre>
				{/if}
			</div>
		{/each}
		<!-- <pre>{JSON.stringify(session.data, null, 4)}</pre> -->
	</div>

	<div use:onResize class="input">
		<PromptInput autofocus />
	</div>
</main>

<style>
	.root {
		--bg: var(--theme-g-app-bg);
		--text: var(--theme-g-text);
		padding: 1rem;
		width: 100%;
		min-height: 100vh;
		overflow: hidden;
		background: var(--bg);
		color: var(--text);
	}
	.input {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.125rem 1rem 1rem 1rem;
		background-color: oklch(from var(--bg) l c h / 0.95);
	}
	.input:focus-within {
		background-color: var(--bg);
	}
</style>
