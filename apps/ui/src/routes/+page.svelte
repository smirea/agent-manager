<script lang="ts">
	import { onMount } from 'svelte';

	let theme = $state<'light' | 'dark'>('light');
	let loading = $state(true);
	let result = $state();

	onMount(async () => {
		result = await (await fetch('/api/sessions')).json();
		loading = false;
	});
</script>

<svelte:head>
	<title>Grok Build</title>
</svelte:head>

<main class="min-h-screen bg-app text-app-ink" data-theme={theme}>
	<div class="flex h-10 w-10 items-center justify-center bg-app text-app-ink">test</div>
	<button onclick={() => (theme = theme === 'light' ? 'dark' : 'light')}>toggle theme</button>
	<pre>{loading ? 'loading ...' : JSON.stringify(result, null, 4)}</pre>
</main>
