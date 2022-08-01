<script lang="ts">
    import { date } from "svelte-i18n";
    import EnvelopeIcon from "svelte-icons/fa/FaEnvelope.svelte";
    import Page from "../layout/Page.svelte";
    import { _ } from "../services/i18n";
    import { loggedInUserStore } from "../stores/loggedInUserStore";
</script>

<Page editHandler={() => console.log("edit")} title={$_("app.profile.title")}>
    {#if $loggedInUserStore}
        <header>
            <img
                src={$loggedInUserStore.image}
                alt={$_("app.profile.imageAltText")}
                class="userImage atRight"
            />
            <h3>
                {$loggedInUserStore.firstName}
                {$loggedInUserStore.lastName}
            </h3>

            <p>
                {$_("app.profile.projects", {
                    values: {
                        count: $loggedInUserStore.projectsShortInfo.length,
                    },
                })}
            </p>

            <p>
                {$_("app.profile.registration", {
                    values: {
                        date: $date(
                            new Date($loggedInUserStore.registrationDate),
                            {
                                format: "medium",
                            }
                        ),
                    },
                })}
            </p>
        </header>

        <p class="fullWidth">
            {$loggedInUserStore.description}
        </p>

        <button
            class="primary send-message"
            on:click={() => console.log("message")}
        >
            <div class="icon"><EnvelopeIcon /></div>
            {$_("app.profile.sendMessage")}
        </button>

        <ul class="tag-list">
            {#each $loggedInUserStore.tags as tag}
                <li>{tag}</li>
            {/each}
        </ul>

        <div>Projekte kommen hier...</div>
    {:else}
        {$_("app.profile.loading")}
    {/if}
</Page>

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
        padding: 2px 10px;
    }

    .send-message {
        margin: 30px;
        align-self: center;
    }
</style>
