<script lang="ts">
	import { onMount } from 'svelte';
	import { orpc } from '$lib/orpc';

	let theme = $state<'light' | 'dark'>('light');
	let projects = $state<Awaited<ReturnType<typeof orpc.sessions.list>>>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			projects = await orpc.sessions.list();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sessions';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Agent Manager</title>
</svelte:head>

<main class="min-h-screen bg-app px-6 py-5 text-app-ink" data-theme={theme}>
	<div class="mx-auto flex max-w-5xl flex-col gap-5">
		<header class="flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold">Agent Manager</h1>
				<p class="text-sm text-panel-ink/70">Sessions loaded through a typed oRPC client.</p>
			</div>
			<button
				class="rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-ink"
				onclick={() => (theme = theme === 'light' ? 'dark' : 'light')}
			>
				{theme === 'light' ? 'Dark' : 'Light'}
			</button>
		</header>

		<section class="rounded-lg border border-border bg-panel text-panel-ink">
			<div class="border-b border-border px-4 py-3">
				<h2 class="text-sm font-medium">Grok sessions</h2>
			</div>

			{#if loading}
				<p class="px-4 py-6 text-sm text-panel-ink/70">Loading sessions...</p>
			{:else if error}
				<p class="px-4 py-6 text-sm text-error">{error}</p>
			{:else if projects.length === 0}
				<p class="px-4 py-6 text-sm text-panel-ink/70">No sessions found.</p>
			{:else}
				<ul class="divide-y divide-border">
					{#each projects as project}
						<li class="px-4 py-3">
							<div class="flex items-center justify-between gap-4">
								<div class="min-w-0">
									<h3 class="truncate text-sm font-medium">{project.name}</h3>
									<p class="truncate font-mono text-xs text-panel-ink/60">{project.path}</p>
								</div>
								<span class="shrink-0 text-sm text-panel-ink/70">
									{project.sessions.length}
									{project.sessions.length === 1 ? 'session' : 'sessions'}
								</span>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</main>
