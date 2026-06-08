<script lang="ts">
	import type * as acp from '@agentclientprotocol/sdk';
	import Markdown from './Markdown.svelte';

	const { content, class: cls }: { content: acp.ContentBlock; class?: string } = $props();

	const dataUrl = (mimeType: string, data: string) => `data:${mimeType};base64,${data}`;
	const formatSize = (size?: number | null) => {
		if (size == null) return '';
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
		return `${Math.round(size / 1024 / 102.4) / 10} MB`;
	};
</script>

<div class={['content-block', cls]} data-content-block-type={content.type}>
	{#if content.type === 'text'}
		<Markdown source={content.text} />
	{:else if content.type === 'image'}
		<figure class="media">
			<img
				src={content.uri ?? dataUrl(content.mimeType, content.data)}
				alt={content.annotations?.audience?.join(', ') ?? 'image'}
			/>
			<figcaption>{content.mimeType}</figcaption>
		</figure>
	{:else if content.type === 'audio'}
		<div class="media">
			<audio controls src={dataUrl(content.mimeType, content.data)}></audio>
			<div class="caption">{content.mimeType}</div>
		</div>
	{:else if content.type === 'resource_link'}
		<a class="resource-link" href={content.uri} tabindex="-1">
			<span>{content.title ?? content.name}</span>
			<span class="muted">{content.mimeType ?? content.uri}</span>
			{#if content.size != null}<span class="muted">{formatSize(content.size)}</span>{/if}
		</a>
	{:else if content.type === 'resource'}
		{@const resource = content.resource}
		<div class="resource">
			<div class="resource-title">
				<span>{resource.uri}</span>
				{#if resource.mimeType}<span class="muted">{resource.mimeType}</span>{/if}
			</div>
			{#if 'text' in resource}
				<pre>{resource.text}</pre>
			{:else}
				<div class="blob">blob · {formatSize(Math.ceil(resource.blob.length * 0.75))}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.content-block {
		min-width: 0;
	}

	.media {
		margin: 0.35rem 0;
	}

	img {
		display: block;
		max-width: min(100%, 42rem);
		max-height: 24rem;
		object-fit: contain;
		border: 1px solid var(--grok-border-subtle);
	}

	audio {
		width: min(100%, 28rem);
	}

	figcaption,
	.caption,
	.muted,
	.blob {
		color: var(--grok-text-muted);
	}

	figcaption,
	.caption {
		margin-top: 0.25rem;
		font-size: var(--text-xs);
	}

	.resource-link,
	.resource {
		display: block;
		margin: 0.35rem 0;
		color: var(--grok-md-text);
	}

	.resource-link {
		text-decoration: none;
	}

	.resource-link:hover {
		color: var(--grok-link-hover);
	}

	.resource-link span,
	.resource-title span {
		margin-right: 0.5rem;
	}

	.resource pre {
		margin: 0.35rem 0 0;
		padding: 0.35rem 0.65rem;
		background: var(--grok-pre-bg);
		color: var(--grok-pre-fg);
	}
</style>
