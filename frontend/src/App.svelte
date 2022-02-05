<script lang="ts">
	import { getLocaleFromNavigator } from "svelte-i18n";
	import { isLocaleLoaded, setupI18n, _ } from "./services/i18n";

	export let name: string;
	$: if (!$isLocaleLoaded) {
		setupI18n({ withLocale: getLocaleFromNavigator() });
	}
</script>

{#if $isLocaleLoaded}
	<main>
		<h1>{$_("app.greeting", { values: { name } })}</h1>
		<p>
			Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn
			how to build Svelte apps.
		</p>
	</main>

	<style>
		main {
			text-align: center;
			padding: 1em;
			max-width: 240px;
			margin: 0 auto;
		}

		h1 {
			color: #ff3e00;
			text-transform: uppercase;
			font-size: 4em;
			font-weight: 100;
		}

		@media (min-width: 640px) {
			main {
				max-width: none;
			}
		}
	</style>
{/if}
