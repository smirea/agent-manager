<script lang="ts">
	import type { ClankerContent } from '$lib/utils/compileUpdates';

	const { tool, class: cls, ...rest }: { class?: string; tool: ClankerContent & { type: 'tool' } } = $props();

	const out = $derived(tool.rawOutput);
	const c = $derived(out ? ('type' in out ? out : { type: 'unknown' as const, ...out }) : { type: 'empty' as const });
</script>

<div {...rest} data-tool-content-type={c.type} class={[cls, 'pt-1 mb-2']}>
	{#if c.type === 'empty'}
		<div></div>
	{:else if c.type === 'Bash'}
		<div>{c.description}</div>
		<pre>{c.output_for_prompt.split('\n').slice(1).join('\n')}</pre>
	{:else if c.type === 'ReadFile'}
		<pre>{c.FileContent.content_concise}</pre>
	{:else if c.type === 'ListDir'}
		<pre>{'NotFound' in c ? c.NotFound : c.Content.content}</pre>
	{:else if c.type === 'SearchReplace'}
		<pre>{'NoMatchesFound' in c ? 'No matches found' : c.EditsApplied.edits}</pre>
	{:else if c.type === 'GrepSearch'}
		{#each c.file_matches as file}
			<div>
				<b class="block" style:color="var(--grok-tool-title)">{file.path}</b>
				<table class="ml-8">
					<tbody>
						{#each file.matches as m}
							<tr><td>{m.line_number}</td><td>{m.content}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	{:else}
		<div class="todo">TODO: tool.type={c.type}</div>
	{/if}
</div>

<style>
	.todo {
		color: var(--grok-accent-error);
	}
</style>
