<script lang="ts">
    import type { UserDTO } from "../../../../mock-backend/mocks/models/user";
    import Page from "../../layout/Page.svelte";
    import { HttpError } from "../../services/api";
    import { loadAndSetUser } from "../../services/dataLoading";
    import { _ } from "../../services/i18n";
    import UserProfile from "./components/UserProfile.svelte";

    type UserId = UserDTO["id"];
    export let userId: UserId;

    const [userStore, errorStore] = loadAndSetUser(userId);
</script>

<Page editHandler={() => console.log("edit")} title={$_("app.profile.title")}>
    {#if $userStore}
        <UserProfile user={$userStore} />
    {:else if $errorStore}
        {#if $errorStore instanceof HttpError && $errorStore.errorCode == 404}
            {$_("app.profile.notFound")}
        {:else}
            {$_("app.profile.errorWhileLoading", {
                values: { errorText: $errorStore.message },
            })}
        {/if}
    {:else}
        {$_("app.profile.loading")}
    {/if}
</Page>
