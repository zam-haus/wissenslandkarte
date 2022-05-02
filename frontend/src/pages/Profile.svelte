<script lang="ts">
    import { date } from "svelte-i18n";
    
    import { _ } from "../services/i18n";
    import { userStore } from "../stores/user";

    import Page from "../layout/Page.svelte";
</script>

<Page editHandler={() => console.log('edit')} title="Profile">
    {#if $userStore}
        <h3>{$userStore.firstName} {$userStore.lastName}</h3>
        <p>
            {$_("app.profile.registration", {
                values: {
                    date: $date(new Date($userStore.registrationDate), {
                        format: "medium",
                    }),
                },
            })}
        </p>
        <p>
            {$userStore.description}
        </p>
        <ul>
            {#each $userStore.tags as tag}
                <li>{tag}</li>
            {/each}
        </ul>
    {:else}
        {$_("app.profile.loading")}
    {/if}
</Page>