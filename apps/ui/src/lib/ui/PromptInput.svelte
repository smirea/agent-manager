<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { value = $bindable(''), class: cn, ...rest }: HTMLInputAttributes = $props();
</script>

<fieldset class="root rotate-180">
	<legend class="rotate-180 mx-4 px-1 text-xs">Grok Build</legend>
	<div class="rotate-180 w-full flex pt-1.5 px-2 text-sm">
		<div class="flex-0 font-mono mr-1 chevron">❭</div>
		<input {...rest} bind:value class={[cn, 'outline-none font-mono w-full']} />
	</div>
</fieldset>

<style>
	.root {
		--border: var(--theme-g-border-faded);
		--text: var(--theme-g-text-faded);
		position: relative;
	}
	.root:focus-within {
		--border: var(--theme-g-border);
		--text: var(--theme-g-text);
	}
	fieldset {
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	legend {
		color: var(--border);
	}
	input,
	.chevron {
		color: var(--text);
	}
</style>
