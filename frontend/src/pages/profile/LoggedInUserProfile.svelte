<script lang="ts">
    import Page from "../../layout/Page.svelte";
    import { _ } from "../../services/i18n";
    import { loggedInUserStore } from "../../stores/loggedInUserStore";
    import UserProfile from "./components/UserProfile.svelte";
</script>

<Page editHandler={() => console.log("edit")} title={$_("app.profile.title")}>
    {#if $loggedInUserStore}
        <UserProfile user={$loggedInUserStore} />
    {:else}
        {$_("app.profile.loading")}
    {/if}
</Page>
