<script lang="ts">
	const {
		text,
		class: cls,
		startLine = 1,
		empty = '',
	}: { text?: string | null; class?: string; startLine?: number; empty?: string } = $props();

	type Row = { number: string; text: string };

	const rows = $derived.by(() => {
		const source = text ?? '';
		if (!source) return [] as Row[];
		return source
			.replace(/\n$/, '')
			.split('\n')
			.map((line, index) => {
				const match = /^(\d+)→(.*)$/.exec(line);
				return {
					number: match?.[1] ?? String(startLine + index),
					text: match?.[2] ?? line,
				};
			});
	});
</script>

<div class={['file-text', cls]}>
	{#if rows.length === 0}
		{#if empty}<div class="empty">{empty}</div>{/if}
	{:else}
		{#each rows as row}
			<div class="line">
				<span class="number">{row.number}</span>
				<span class="text">{row.text || ' '}</span>
			</div>
		{/each}
	{/if}
</div>

<style>
	.file-text {
		margin: 0.35rem 0;
		overflow-x: auto;
	}

	.line {
		display: grid;
		grid-template-columns: 2.4rem minmax(0, 1fr);
		column-gap: 0.6rem;
		min-width: max-content;
	}

	.number {
		color: var(--grok-diff-gutter-fg);
		text-align: right;
		user-select: none;
	}

	.text {
		color: var(--grok-md-text);
		white-space: pre;
	}

	.empty {
		color: var(--grok-text-muted);
	}
</style>
