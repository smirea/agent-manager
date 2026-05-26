<script lang="ts">
	import { orpc } from '$lib/orpc';
	import PromptInput from '$lib/ui/PromptInput.svelte';
	import { createQuery } from '@tanstack/svelte-query';

	let theme = $state<'light' | 'dark'>('light');
	const sessions = createQuery(() => orpc.sessions.list.queryOptions());
</script>

<svelte:head>
	<title>Agent Manager</title>
</svelte:head>

<main class="min-h-screen bg-app-g px-6 py-5 text-g-text" data-theme={theme}>
	some text

	<PromptInput autofocus />
</main>
