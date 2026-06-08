<script lang="ts">
	import type { GrokSearchReplaceEditDetail } from '@repo/shared';

	const {
		path,
		oldText,
		newText,
		details,
	}: {
		path?: string;
		oldText?: string | null;
		newText?: string | null;
		details?: GrokSearchReplaceEditDetail[] | null;
	} = $props();

	type Row = { kind: 'same' | 'delete' | 'insert'; oldLine?: number; newLine?: number; text: string };

	const splitLines = (value?: string | null) => (value ? value.replace(/\n$/, '').split('\n') : []);

	const rowsFromDetails = (items: GrokSearchReplaceEditDetail[]) => {
		const rows: Row[] = [];
		for (const item of items) {
			const before = splitLines(item.context_before);
			const oldLines = splitLines(item.old_string);
			const newLines = splitLines(item.new_string);
			const after = splitLines(item.context_after);
			const oldContextStart = Math.max(1, item.old_line - before.length);
			const newContextStart = Math.max(1, item.new_line - before.length);

			before.forEach((text, index) =>
				rows.push({ kind: 'same', oldLine: oldContextStart + index, newLine: newContextStart + index, text }),
			);
			oldLines.forEach((text, index) => rows.push({ kind: 'delete', oldLine: item.old_line + index, text }));
			newLines.forEach((text, index) => rows.push({ kind: 'insert', newLine: item.new_line + index, text }));
			after.forEach((text, index) =>
				rows.push({
					kind: 'same',
					oldLine: item.old_line + oldLines.length + index,
					newLine: item.new_line + newLines.length + index,
					text,
				}),
			);
		}
		return rows;
	};

	const rowsFromText = (oldValue?: string | null, newValue?: string | null) => {
		const oldLines = splitLines(oldValue);
		const newLines = splitLines(newValue);
		let prefix = 0;
		while (oldLines[prefix] === newLines[prefix] && prefix < oldLines.length && prefix < newLines.length) prefix++;

		let suffix = 0;
		while (
			suffix + prefix < oldLines.length &&
			suffix + prefix < newLines.length &&
			oldLines[oldLines.length - suffix - 1] === newLines[newLines.length - suffix - 1]
		) {
			suffix++;
		}

		const rows: Row[] = [];
		for (let index = 0; index < prefix; index++) {
			rows.push({ kind: 'same', oldLine: index + 1, newLine: index + 1, text: oldLines[index] });
		}
		for (let index = prefix; index < oldLines.length - suffix; index++) {
			rows.push({ kind: 'delete', oldLine: index + 1, text: oldLines[index] });
		}
		for (let index = prefix; index < newLines.length - suffix; index++) {
			rows.push({ kind: 'insert', newLine: index + 1, text: newLines[index] });
		}
		for (let index = 0; index < suffix; index++) {
			const oldIndex = oldLines.length - suffix + index;
			const newIndex = newLines.length - suffix + index;
			rows.push({ kind: 'same', oldLine: oldIndex + 1, newLine: newIndex + 1, text: oldLines[oldIndex] });
		}
		return rows;
	};

	const rows = $derived(details?.length ? rowsFromDetails(details) : rowsFromText(oldText, newText));
</script>

<div class="diff">
	{#if path}<div class="path">{path}</div>{/if}
	{#if rows.length === 0}
		<div class="empty">No changes</div>
	{:else}
		{#each rows as row}
			<div class="line" data-kind={row.kind}>
				<span class="mark">{row.kind === 'insert' ? '+' : row.kind === 'delete' ? '-' : ' '}</span>
				<span class="number">{row.oldLine ?? ''}</span>
				<span class="number">{row.newLine ?? ''}</span>
				<span class="text">{row.text || ' '}</span>
			</div>
		{/each}
	{/if}
</div>

<style>
	.diff {
		margin: 0.35rem 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: 1.45;
		overflow-x: auto;
	}

	.path {
		margin-bottom: 0.2rem;
		color: var(--grok-path);
		font-weight: bold;
	}

	.line {
		display: grid;
		grid-template-columns: 1rem 3rem 3rem minmax(0, 1fr);
		min-width: max-content;
	}

	.line[data-kind='delete'] {
		background: var(--grok-diff-delete-bg);
		color: var(--grok-diff-delete-fg);
	}

	.line[data-kind='insert'] {
		background: var(--grok-diff-insert-bg);
		color: var(--grok-diff-insert-fg);
	}

	.line[data-kind='same'] {
		color: var(--grok-diff-equal-fg);
	}

	.mark,
	.number {
		color: var(--grok-diff-gutter-fg);
		user-select: none;
	}

	.number {
		padding-right: 0.75rem;
		text-align: right;
	}

	.text {
		white-space: pre;
	}

	.empty {
		color: var(--grok-text-muted);
	}
</style>
