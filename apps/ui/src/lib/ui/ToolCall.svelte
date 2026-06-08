<script lang="ts">
	import type { CompiledTool } from '$lib/utils/compileUpdates';
	import {
		isBashTool,
		isGrepTool,
		isListDirContent,
		isListDirNotFound,
		isListDirTool,
		isReadFileTool,
		isTodoWriteTool,
	} from '$lib/utils/clankerTools';
	import ToolToggle from './ToolToggle.svelte';

	let {
		tool,
		toggleProps,
	}: {
		tool: CompiledTool;
		toggleProps: { open: boolean; onChange: (v: boolean) => void };
	} = $props();
</script>

{#if isListDirTool(tool)}
	<ToolToggle
		title="List"
		titleExtra={[{ text: tool.rawInput?.target_directory ?? tool.title ?? '' }]}
		{...toggleProps}
	>
		{#if isListDirContent(tool.rawOutput)}
			<pre>{tool.rawOutput.Content.content}</pre>
		{:else if isListDirNotFound(tool.rawOutput)}
			<pre>{tool.rawOutput.NotFound}</pre>
		{/if}
	</ToolToggle>
{:else if isReadFileTool(tool)}
	<ToolToggle title="Read" titleExtra={[{ text: tool.rawInput?.target_file ?? tool.title ?? '' }]} {...toggleProps}>
		<pre>{tool.rawOutput?.FileContent.content}</pre>
	</ToolToggle>
{:else if isBashTool(tool)}
	<ToolToggle
		title="Run"
		titleExtra={[{ text: tool.rawInput?.command ?? tool.title ?? '', color: 'var(--grok-tool-system)' }]}
		{...toggleProps}
	>
		<div class="mt-1">{tool.rawInput?.description}</div>
		{#each tool.content ?? [] as content}
			<div class="my-1">
				{#if content.type === 'content'}
					{#if content.content.type === 'text'}
						{content.content.text}
					{:else}
						<div class="todo">content.content.type === {content.content.type}</div>
					{/if}
				{:else}
					<div class="todo">content.type === {content.type}</div>
				{/if}
			</div>
		{/each}
	</ToolToggle>
{:else if isGrepTool(tool)}
	<ToolToggle
		title="Search"
		titleExtra={[{ text: `"${tool.rawInput?.pattern ?? ''}"`, color: 'var(--grok-tool-success)' }]}
		{...toggleProps}
	>
		{JSON.stringify(tool)}
	</ToolToggle>
{:else if isTodoWriteTool(tool)}
	<div class="todo">todo: TodoWrite</div>
{:else if !tool.variant}
	<b class="todo">TODO: no variant</b>
{:else}
	<b class="todo">(TODO: variant={tool.variant})</b>{tool.title}
	<pre>rawInput = {JSON.stringify(tool.rawInput)}</pre>
	<pre>{JSON.stringify(tool)}</pre>
{/if}

<style>
	.todo {
		color: var(--grok-accent-error);
	}
</style>
