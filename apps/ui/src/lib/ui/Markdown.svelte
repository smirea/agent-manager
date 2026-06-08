<script lang="ts">
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import type { ComponentProps } from 'svelte';
	const { class: cn, ...props }: { class?: string } & ComponentProps<typeof SvelteMarkdown> = $props();

	const anchorAttributes = new Set(['href', 'title', 'target', 'rel', 'aria-label']);
	const validAttributeName = /^[A-Za-z_:][A-Za-z0-9_:.-]*$/;

	function safeAnchorAttributes(attributes: Record<string, unknown> | null | undefined) {
		const safe: Record<string, string> = {};

		for (const [name, value] of Object.entries(attributes ?? {})) {
			if (!anchorAttributes.has(name) || !validAttributeName.test(name) || value == null || value === false) continue;
			safe[name] = String(value);
		}

		return safe;
	}
</script>

<div class={['root', cn]}>
	<SvelteMarkdown {...props}>
		{#snippet link({ href, title, children })}
			<a {href} {title} tabindex="-1" data-snippet="link">
				{@render children?.()}
			</a>
		{/snippet}
		{#snippet html_a({ attributes, children })}
			<a {...safeAnchorAttributes(attributes)} tabindex="-1" data-snippet="html_a">
				{@render children?.()}
			</a>
		{/snippet}
	</SvelteMarkdown>
</div>

<style>
	.root {
		color: var(--grok-md-text);
	}

	/* Block spacing (terminal scrollback is tight) */
	.root :global(p) {
		margin: 0.45em 0;
	}

	.root :global(h1),
	.root :global(h2),
	.root :global(h3),
	.root :global(h4),
	.root :global(h5),
	.root :global(h6) {
		margin: 1rem 0;
		font-weight: bold;
	}

	.root :global(h1) {
		color: var(--grok-md-h1);
	}
	.root :global(h2),
	.root :global(h3) {
		color: var(--grok-md-h2);
	}
	.root :global(h4) {
		color: var(--grok-md-h4);
	}
	.root :global(h5) {
		color: var(--grok-md-h5);
	}
	.root :global(h6) {
		color: var(--grok-md-h6);
	}

	/* Lists — undo tailwind preflight list-style:none */
	.root :global(ul),
	.root :global(ol) {
		margin: 1rem 0;
		padding-left: 1.35em;
	}

	.root :global(ul) {
		list-style-type: '●';
	}

	.root :global(ol) {
		list-style-type: decimal;
	}

	.root :global(li) {
		padding-left: 0.5rem;
	}

	.root :global(li::marker) {
		color: var(--grok-md-muted);
	}

	.root :global(li > :first-child) {
		margin-top: 0;
	}

	.root :global(li > :last-child) {
		margin-bottom: 0;
	}

	.root :global(strong) {
		font-weight: bold;
		/* color: var(--grok-strong); */ /* not actually used */
	}

	.root :global(a) {
		color: var(--grok-md-link);
	}
	.root :global(a:hover) {
		color: var(--grok-link-hover);
	}

	.root :global(blockquote) {
		margin: 0.45em 0;
		padding-left: 1rem;
		border-left: 3px solid var(--grok-blockquote-border);
		color: var(--grok-blockquote-fg);
	}

	.root :global(hr) {
		border: none;
		border-top: 1px solid var(--grok-md-hr);
		margin: 0.75em 0;
	}

	.root :global(pre) {
		margin: 0.45em 0;
		padding: 0.35rem 0.65rem;
		background-color: var(--grok-pre-bg);
		color: var(--grok-pre-fg);
	}

	.root :global(:not(pre) > code) {
		color: var(--grok-inline-code);
	}

	.root :global(pre code) {
		color: inherit;
	}

	/* Table grid — separate borders so every line is visible (collapse was dropping edges) */
	.root :global(table) {
		width: 100%;
		margin: 0.65em 0;
		border-collapse: separate;
		border-spacing: 0;
		border: 1px solid var(--grok-table-border);
	}

	.root :global(th),
	.root :global(td) {
		padding: 0.3rem 0.65rem;
		text-align: left;
		vertical-align: top;
		border: 0 solid var(--grok-table-border);
		border-right-width: 1px;
		border-bottom-width: 1px;
	}

	.root :global(tr > :last-child) {
		border-right-width: 0;
	}

	.root :global(tbody tr:last-child > *) {
		border-bottom-width: 0;
	}

	.root :global(th) {
		background-color: var(--grok-table-head-bg);
		color: var(--grok-table-head-fg);
		font-weight: bold;
	}
</style>
