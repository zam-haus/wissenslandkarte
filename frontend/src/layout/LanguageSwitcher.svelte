<script lang="ts">
    import { locale, _ } from "svelte-i18n";
    import { isI18nLoading } from "./services/i18n";
</script>

{#if !$isI18nLoading}
    <h3>{$_("app.change_lang")} ({$locale})</h3>

    <div>
        <button
            on:click={() => locale.set("de")}
            class:active={$locale.startsWith("de")}
        >
            {$_("app.lang.de")}
        </button>

        <button
            on:click={() => locale.set("en")}
            class:active={$locale.startsWith("en")}
        >
            {$_("app.lang.en")}
        </button>
    </div>

    <style>
        button.active {
            border: 4px solid #ff3e00;
        }
    </style>
{/if}
