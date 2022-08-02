<script lang="ts">
    import { derived } from "svelte/store";
    import type { UserDTO } from "../../../../mock-backend/mocks/models/user";
    import Page from "../../layout/Page.svelte";
    import { _ } from "../../services/i18n";
    import {
        generalUsersStore,
        loadAndSetUser,
    } from "../../stores/generalUsersStore";
    import UserProfile from "./components/UserProfile.svelte";

    type UserId = UserDTO["id"];
    export let userId: UserId;

    loadAndSetUser(userId);
    const userStore = derived(generalUsersStore, (store) => store[userId]);
</script>

<Page editHandler={() => console.log("edit")} title={$_("app.profile.title")}>
    {#if $userStore}
        <UserProfile user={$userStore} />
    {:else}
        {$_("app.profile.loading")}
    {/if}
</Page>
