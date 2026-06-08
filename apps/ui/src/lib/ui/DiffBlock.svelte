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

	type Row = { kind: 'same' | 'delete' | 'insert' | 'create'; line?: number; text: string };

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

			before.forEach((text, index) => rows.push({ kind: 'same', line: oldContextStart + index, text }));
			oldLines.forEach((text, index) =>
				rows.push({ kind: 'delete', line: item.old_line + index, text: `${item.line_prefix ?? ''}${text}` }),
			);
			newLines.forEach((text, index) =>
				rows.push({
					kind: oldLines.length === 0 ? 'create' : 'insert',
					line: item.new_line + index,
					text: `${item.line_prefix ?? ''}${text}`,
				}),
			);
			after.forEach((text, index) =>
				rows.push({
					kind: 'same',
					line: item.new_line + newLines.length + index,
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
			rows.push({ kind: 'same', line: index + 1, text: oldLines[index] });
		}
		for (let index = prefix; index < oldLines.length - suffix; index++) {
			rows.push({ kind: 'delete', line: index + 1, text: oldLines[index] });
		}
		for (let index = prefix; index < newLines.length - suffix; index++) {
			rows.push({ kind: oldLines.length === 0 ? 'create' : 'insert', line: index + 1, text: newLines[index] });
		}
		for (let index = 0; index < suffix; index++) {
			const newIndex = newLines.length - suffix + index;
			rows.push({ kind: 'same', line: newIndex + 1, text: newLines[newIndex] });
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
				<span class="number">{row.line ?? ''}</span>
				<span class="text">{row.text || ' '}</span>
			</div>
		{/each}
	{/if}
</div>

<style>
	.diff {
		margin: 0.35rem 0;
		overflow-x: auto;
	}

	.path {
		display: none;
	}

	.line {
		display: grid;
		grid-template-columns: 1rem 2.4rem minmax(0, 1fr);
		min-width: max-content;
	}

	.line[data-kind='delete'] {
		color: var(--grok-diff-delete-fg);
	}

	.line[data-kind='insert'] {
		color: var(--grok-diff-insert-fg);
	}

	.line[data-kind='create'],
	.line[data-kind='same'] {
		color: var(--grok-md-text);
	}

	.mark,
	.number {
		color: var(--grok-diff-gutter-fg);
		user-select: none;
	}

	.number {
		padding-right: 0.6rem;
		text-align: right;
	}

	.text {
		white-space: pre;
	}

	.empty {
		color: var(--grok-text-muted);
	}
</style>
