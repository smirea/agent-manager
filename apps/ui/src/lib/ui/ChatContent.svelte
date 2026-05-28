<script lang="ts">
	import compileUpdates from '$lib/utils/compileUpdates';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';

	const { compiled, ...rest }: { compiled: ReturnType<typeof compileUpdates> } = $props();
	$effect(() => console.log(compiled));
</script>

{#each compiled.chat as item}
	{#if item.role === 'user'}
		<div><b>user:</b> {item.text}</div>
	{:else}
		<div>
			<div><b>agent:</b></div>
			{#each item.content as c}
				{#if c.type === 'text'}
					<div class={{ 'agent-text': true, thinking: c.thinking }}>
						<b>text:</b>
						<SvelteMarkdown source={c.text} />
					</div>
				{/if}
			{/each}
		</div>
	{/if}
{/each}

<style>
	.agent-text.thinking {
		color: var(--theme-g-text-thinking);
	}
</style>
