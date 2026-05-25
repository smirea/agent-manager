<script lang="ts">
	import { AppBar, Progress, Tabs } from '@skeletonlabs/skeleton-svelte';
	import type {Agent, AgentEvent, HealthResponse} from '@repo/shared';

	let health: HealthResponse | undefined = $state();
	let agents: Agent[] = $state([]);
	let commandOutput = $state('');
	let events: AgentEvent[] = $state([]);
	let error = $state('');
	let backendProgress = $derived(health?.ok ? 100 : 25);

	async function loadHealth() {
		error = '';
		try {
			const response = await fetch('/api/health');
			health = await response.json();
		} catch (caught) {
			error = caught instanceof Error ? caught.message : String(caught);
		}
	}

	async function loadAgents() {
		const response = await fetch('/api/agents');
		const body = await response.json();
		agents = body.agents;
	}

	async function runDateCommand() {
		const response = await fetch('/api/commands/date', {method: 'POST'});
		const body = await response.json();
		commandOutput = `${body.command} exited ${body.exitCode}: ${body.output}`;
	}

	$effect(() => {
		loadHealth();
		loadAgents();

		const source = new EventSource('/api/events');
		source.addEventListener('connected', (event) => {
			events = [JSON.parse(event.data), ...events].slice(0, 8);
		});
		source.addEventListener('heartbeat', (event) => {
			events = [JSON.parse(event.data), ...events].slice(0, 8);
		});

		return () => source.close();
	});
</script>

<svelte:head>
	<title>Agent Manager</title>
</svelte:head>

<main class="min-h-screen bg-surface-100-900 text-surface-950-50">
	<AppBar class="border-b border-surface-300-700 bg-surface-50-950">
		<AppBar.Toolbar class="mx-auto flex max-w-6xl items-center justify-between gap-4 p-6">
			<AppBar.Lead class="min-w-0">
				<p class="text-xs font-bold uppercase text-primary-700-300">Agent Manager</p>
				<h1 class="max-w-3xl text-4xl font-bold leading-none md:text-5xl">
					Local agents, one browser-safe UI.
				</h1>
			</AppBar.Lead>
			<AppBar.Trail>
				<button class="btn preset-filled-primary-500" type="button" onclick={loadHealth}>Refresh API</button>
			</AppBar.Trail>
		</AppBar.Toolbar>
	</AppBar>

	<section class="mx-auto grid max-w-6xl gap-5 p-6">
		{#if error}
			<div class="card preset-filled-error-50-950 p-4">{error}</div>
		{/if}

		<Tabs defaultValue="backend" class="grid gap-4">
			<Tabs.List class="card flex gap-2 bg-surface-50-950 p-2 shadow-sm">
				<Tabs.Trigger class="btn flex-1 data-[selected]:preset-filled-primary-500" value="backend">
					Backend
				</Tabs.Trigger>
				<Tabs.Trigger class="btn flex-1 data-[selected]:preset-filled-primary-500" value="agents">
					Agents
				</Tabs.Trigger>
				<Tabs.Trigger class="btn flex-1 data-[selected]:preset-filled-primary-500" value="events">
					SSE stream
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content class="card grid gap-5 bg-surface-50-950 p-5 shadow-sm" value="backend">
				<div class="flex items-center justify-between gap-4">
					<h2 class="text-xl font-bold">Backend</h2>
					<span class="badge {health?.ok ? 'preset-filled-success-500' : 'preset-filled-warning-500'}">
						{health?.ok ? 'Connected' : 'Waiting'}
					</span>
				</div>
				<Progress value={backendProgress}>
					<Progress.Track class="h-2 rounded-container bg-surface-200-800">
						<Progress.Range class="h-full rounded-container preset-filled-success-500" />
					</Progress.Track>
				</Progress>
				<dl class="grid gap-4 md:grid-cols-3">
					<div>
						<dt>Runtime</dt>
						<dd>{health?.runtime ?? 'unknown'}</dd>
					</div>
					<div>
						<dt>Workspace</dt>
						<dd>{health?.workspace ?? 'not loaded'}</dd>
					</div>
					<div>
						<dt>Server time</dt>
						<dd>{health?.now ?? 'not loaded'}</dd>
					</div>
				</dl>
			</Tabs.Content>

			<Tabs.Content class="card grid gap-4 bg-surface-50-950 p-5 shadow-sm" value="agents">
				<div class="flex items-center justify-between gap-4">
					<h2 class="text-xl font-bold">Agents</h2>
					<button class="btn preset-filled-primary-500" type="button" onclick={runDateCommand}>
						Run example command
					</button>
				</div>
				{#each agents as agent}
					<div class="card flex items-center justify-between gap-4 bg-surface-100-900 p-4">
						<div class="grid gap-1">
							<strong>{agent.name}</strong>
							<span class="text-sm text-surface-600-400">{agent.command}</span>
						</div>
						<span class="badge preset-filled-surface-200-800">{agent.status}</span>
					</div>
				{/each}
				{#if commandOutput}
					<pre class="overflow-auto rounded-container bg-surface-100-900 p-4">{commandOutput}</pre>
				{/if}
			</Tabs.Content>

			<Tabs.Content class="card grid gap-3 bg-surface-50-950 p-5 shadow-sm" value="events">
				<h2 class="text-xl font-bold">SSE stream</h2>
				{#each events as event}
					<div class="flex items-center justify-between gap-4 border-b border-surface-200-800 py-3">
						<span class="badge preset-filled-primary-500">{event.type}</span>
						<span class="text-sm">{event.now}</span>
					</div>
				{/each}
			</Tabs.Content>
		</Tabs>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
	}

	dt {
		color: var(--color-surface-600-400);
		font-size: 0.82rem;
	}

	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
</style>
