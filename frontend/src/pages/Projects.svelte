<script lang="ts">
    import Page from "../layout/Page.svelte";
    import ProjectListEntry from "./ProjectListEntry.svelte";
    import { projectsStore } from "../services/projectStore";

    const pageSize = 5;
    let current = 0;

    function nextPage(): void {
        current = (current + 1) > maxPage ? maxPage : current + 1;
    }

    function previousPage(): void {
        current = current - 1 < 0 ? 0 : current - 1;
    }

    $: projectsSubset = $projectsStore.projects.slice(current * pageSize, pageSize + current * pageSize);
    $: maxPage = Math.ceil($projectsStore.projects.length / 5) - 1;
</script>

<Page title="Projects">
    <ul>
        {#if $projectsStore.loading}
            Loading projects...
        {:else}
            {#if $projectsStore.error}
                <p>error loading projects</p>
            {:else}
                {#each projectsSubset as project}
                <li>
                    <ProjectListEntry {project}/>
                </li>
                {:else}
                    <p>no projects yet...</p>
                {/each}
            {/if}
        {/if}
    </ul>

    <div class="pagination">
        <span class:disabled={current===0} on:click={previousPage}>&lt;</span>
        <span class:disabled={current===Math.ceil($projectsStore.projects.length / 5) - 1} on:click={nextPage}>&gt;</span>
    </div>
</Page>

<style type="text/scss">
    ul {
        padding-inline-start: unset;

        display: grid;

        gap: 15px;
        grid-template-rows: 1fr;

        align-items: center;
        justify-content: center;
    }

    .pagination {
        span {
            font-size: 20px;
            user-select: none;
            cursor: pointer;
            padding: 5px;
        }

        .disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
    }
</style>