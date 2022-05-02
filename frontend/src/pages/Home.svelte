<script>
    import Page from "../layout/Page.svelte";

    import { isI18nLoading, _ } from "../services/i18n";
    import { userStore } from "../stores/user";
</script>

<Page>
    {#if $userStore}
        <h1>
            {$_("app.greeting", {
                values: { name: $userStore.firstName },
            })}
        </h1>
    {/if}
</Page>