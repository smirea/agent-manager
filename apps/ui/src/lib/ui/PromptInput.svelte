<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	const { ...rest }: HTMLInputAttributes = $props();
</script>

<div class="root relative">
	<input {...rest} type="text" class="py-1 px-2 font-mono" />
	<div class="bottom flex items-center absolute left-0 right-0 bottom-0 text-sm">
		<div class="border flex-1"></div>
		<div class="label mx-2">Grok Build</div>
		<div class="border w-4"></div>
	</div>
</div>

<style>
	.root {
		--border-color: var(--theme-g-border-faded);
		border: 1px solid var(--border-color);
		border-bottom-color: transparent;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
	}

	.root:focus-within {
		--border-color: var(--theme-g-border) !important;
	}

	input {
		flex: 1 1 0;
		outline: none;
	}

	.bottom {
		transform: translateY(calc(50%));
	}

	.border {
		border: 0;
		border-top: 1px solid var(--border-color);
	}

	.label {
		position: relative;
		color: var(--border-color);
	}
</style>
