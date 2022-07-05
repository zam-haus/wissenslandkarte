<script lang="ts">
    import { date } from "svelte-i18n";
    import EnvelopeIcon from "svelte-icons/fa/FaEnvelope.svelte";

    import { _ } from "../services/i18n";
    import { userStore } from "../stores/user";
    import { projectsStore } from "../stores/projectStore";

    import Page from "../layout/Page.svelte";

    import type { ProjectDTO } from "../../../mock-backend/mocks/models/project";
    import { derived } from "svelte/store";

    $: projectsOfUser = derived([projectsStore, userStore],
        ([projects, currentUser]) => {
            if(projects === undefined || currentUser === undefined) {
                return;
            }
            console.log([projects, currentUser])
            return projects.projects.filter((project) => project.members.some((user) => user.id == currentUser.id)
              ||  project.members.some((user) => user.id == currentUser.id)
            )
        }
    );
</script>

<style>
    /* TODO: css at top or botttom? */
    .userImage {
        margin: 15px;
        margin-top: 0;
        border-radius: 50%;
        border: 1px solid red;
    }

    .atRight {
        float: right;
    }

    .fullWidth {
        clear: both;
    }

    .tag-list {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        margin-top: 15px;
    }

    .tag-list li {
        border-radius: 10px;
        background: white;
        margin: 5px 10px;
        padding: 2px 10px ;
    }

    .send-message {
        margin: 30px;
        align-self: center;
    }
</style>

<Page editHandler={() => console.log('edit')} title="{$_('app.profile.title')}">
    {#if $userStore}
        <header>
            <img
                src={$userStore.image}
                alt="{$_("app.profile.imageAltText")}"
                class="userImage atRight"/>
            <h3>{$userStore.firstName} {$userStore.lastName}</h3>

            <p>
                {#if $projectsOfUser}
                    {$_("app.profile.projects", {
                        values: {count: $projectsOfUser.length}
                    })}
                {/if}
            </p>

            <p>
                {$_("app.profile.registration", {
                    values: {
                        date: $date(new Date($userStore.registrationDate), {
                            format: "medium",
                        }),
                    },
                })}
            </p>
        </header>

        <p class="fullWidth">
            {$userStore.description}
        </p>

        <button class="primary send-message" on:click={() => console.log('message')}>
            <div class="icon"><EnvelopeIcon /></div>
            {$_('app.profile.sendMessage')}
        </button>


        <ul class="tag-list">
            {#each $userStore.tags as tag}
                <li>{tag}</li>
            {/each}
        </ul>

        <div>
            Projekte kommen hier...
        </div>
    {:else}
        {$_("app.profile.loading")}
    {/if}
</Page>