<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let { value = $bindable(''), class: cn, ...rest }: HTMLTextareaAttributes = $props();
</script>

<fieldset class="root rotate-180">
	<legend class="rotate-180 mx-4 px-1 text-xs">Grok Build</legend>
	<div class="rotate-180 w-full flex pt-1.5 px-2 text-sm">
		<div class="chevron flex-0 font-mono mr-1">❯</div>
		<textarea {...rest} bind:value class={[cn, 'input outline-none font-mono w-full']}></textarea>
	</div>
</fieldset>

<style>
	.root {
		--border: var(--grok-prompt-border-idle);
		--text: var(--grok-prompt-text-idle);
		position: relative;
	}
	.root:focus-within {
		--border: var(--grok-prompt-border);
		--text: var(--grok-prompt-text);
	}
	fieldset {
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	legend {
		color: var(--border);
	}
	.input {
		field-sizing: content;
		max-block-size: 10.5lh;
		resize: none;
		color: var(--text);
	}
	.chevron {
		color: var(--grok-prompt-prefix);
	}
</style>
