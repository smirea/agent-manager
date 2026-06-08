<script lang="ts">
	import type * as acp from '@agentclientprotocol/sdk';
	import ContentBlock from './ContentBlock.svelte';
	import DiffBlock from './DiffBlock.svelte';

	const { item }: { item: acp.ToolCallContent } = $props();
</script>

<div class="tool-call-content" data-tool-call-content-type={item.type}>
	{#if item.type === 'content'}
		<ContentBlock content={item.content} />
	{:else if item.type === 'diff'}
		<DiffBlock path={item.path} oldText={item.oldText} newText={item.newText} />
	{:else if item.type === 'terminal'}
		<div class="terminal">Terminal {item.terminalId}</div>
	{/if}
</div>

<style>
	.tool-call-content {
		margin: 0.35rem 0;
	}

	.terminal {
		color: var(--grok-tool-system);
	}
</style>
