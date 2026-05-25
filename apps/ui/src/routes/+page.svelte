<script lang="ts">
	import type {Agent, AgentEvent, HealthResponse} from '@agent-manager/shared';

	let health: HealthResponse | undefined = $state();
	let agents: Agent[] = $state([]);
	let commandOutput = $state('');
	let events: AgentEvent[] = $state([]);
	let error = $state('');

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

<main>
	<section class="workspace">
		<div>
			<p class="eyebrow">Agent Manager</p>
			<h1>Local agents, one browser-safe UI.</h1>
		</div>
		<button type="button" onclick={loadHealth}>Refresh API</button>
	</section>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<section class="grid">
		<div class="panel">
			<h2>Backend</h2>
			<dl>
				<div>
					<dt>Status</dt>
					<dd>{health?.ok ? 'Connected' : 'Waiting'}</dd>
				</div>
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
		</div>

		<div class="panel">
			<h2>Agents</h2>
			{#each agents as agent}
				<div class="agent">
					<div>
						<strong>{agent.name}</strong>
						<span>{agent.command}</span>
					</div>
					<small>{agent.status}</small>
				</div>
			{/each}
			<button type="button" onclick={runDateCommand}>Run example command</button>
			{#if commandOutput}
				<pre>{commandOutput}</pre>
			{/if}
		</div>

		<div class="panel stream">
			<h2>SSE stream</h2>
			{#each events as event}
				<p><span>{event.type}</span> {event.now}</p>
			{/each}
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f6f5f1;
		color: #1e2322;
		font-family:
			Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	}

	main {
		box-sizing: border-box;
		min-height: 100vh;
		padding: 32px;
	}

	button {
		align-self: start;
		border: 1px solid #1e2322;
		border-radius: 6px;
		background: #1e2322;
		color: white;
		cursor: pointer;
		font: inherit;
		padding: 10px 14px;
	}

	.workspace {
		align-items: end;
		display: flex;
		gap: 24px;
		justify-content: space-between;
		margin: 0 auto 28px;
		max-width: 1100px;
	}

	.eyebrow {
		color: #3b6f75;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0;
		margin: 0 0 8px;
		text-transform: uppercase;
	}

	h1 {
		font-size: clamp(2rem, 5vw, 4.4rem);
		line-height: 1;
		margin: 0;
		max-width: 720px;
	}

	h2 {
		font-size: 1rem;
		margin: 0 0 18px;
	}

	.grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin: 0 auto;
		max-width: 1100px;
	}

	.panel {
		background: #ffffff;
		border: 1px solid #ddd8cc;
		border-radius: 8px;
		box-sizing: border-box;
		min-height: 280px;
		padding: 20px;
	}

	dl {
		display: grid;
		gap: 14px;
		margin: 0;
	}

	dl div {
		display: grid;
		gap: 4px;
	}

	dt,
	small,
	.agent span,
	.stream span {
		color: #6a6f6d;
		font-size: 0.82rem;
	}

	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}

	.agent {
		align-items: center;
		border-bottom: 1px solid #ece7dc;
		display: flex;
		justify-content: space-between;
		margin-bottom: 16px;
		padding-bottom: 16px;
	}

	.agent div {
		display: grid;
		gap: 4px;
	}

	pre {
		background: #f1efe8;
		border-radius: 6px;
		margin: 16px 0 0;
		overflow: auto;
		padding: 12px;
	}

	.stream p {
		border-bottom: 1px solid #ece7dc;
		margin: 0;
		padding: 10px 0;
	}

	.error {
		background: #fff0ed;
		border: 1px solid #ec9b8a;
		border-radius: 6px;
		box-sizing: border-box;
		margin: 0 auto 20px;
		max-width: 1100px;
		padding: 12px;
	}

	@media (max-width: 820px) {
		main {
			padding: 20px;
		}

		.workspace {
			align-items: stretch;
			display: grid;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
