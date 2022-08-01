<script lang="ts">
    import MdSearch from "svelte-icons/md/MdSearch.svelte";
    import { navigate } from "svelte-navigator";
    import type { ProjectDTO } from "../../../mock-backend/mocks/models/project";
    import Page from "../layout/Page.svelte";
    import { generalUsersStore } from "../stores/generalUsersStore";
    import { loggedInUserStore } from "../stores/loggedInUserStore";
    import { projectsStore } from "../stores/projectStore";

    let currentProject: ProjectDTO = {
        id: -1,
        title: "",
        description: "",
        creationDate: undefined,
        latestModificationDate: undefined,
        owners: [$loggedInUserStore],
        members: [],
        tags: [],
        mainPhoto: "",
        attachments: [],
        needsProjectArea: false,
    };

    function addProject(): void {
        currentProject.id = $projectsStore.projects.length;
        currentProject.creationDate = new Date();
        currentProject.latestModificationDate = currentProject.creationDate;
        currentProject.members = [getUser(selectedMember)];

        projectsStore.update((ps) => {
            ps.projects = [...ps.projects, currentProject];
            return ps;
        });

        console.log($projectsStore);
    }

    function debug() {
        console.log($projectsStore);
    }

    let selectedMember;

    function getUser(userName: String) {
        return $generalUsersStore.find((user) => user.username == userName);
    }

    function cancel() {
        navigate(-1);
    }
</script>

<Page cancelHandler={cancel} submitHandler={addProject} title="New Project">
    <div class="container">
        <div class="group">
            <label for="name">Projektname</label>
            <input
                class="stretch"
                id="name"
                type="text"
                bind:value={currentProject.title}
            />
        </div>

        <div class="group">
            <label for="description">Beschreibung</label>
            <textarea
                class="stretch"
                id="description"
                bind:value={currentProject.description}
            />
        </div>

        <div class="group">
            <label for="tags">Tags</label>
            <button id="tags">+</button>
        </div>

        <div class="group">
            <label for="search">Weitere Projektmitglieder</label>
            <div class="row">
                <div class="icon"><MdSearch /></div>
                <input
                    class="stretch"
                    id="search"
                    list="users"
                    type="text"
                    bind:value={selectedMember}
                />
                <datalist id="users">
                    {#each $generalUsersStore as user}
                        <option value={user.username} />{/each}
                </datalist>
            </div>
        </div>

        <div class="row">
            <input
                id="projectarea"
                type="checkbox"
                bind:checked={currentProject.needsProjectArea}
            />
            <label for="projectarea">Ich brauche Projektfläche</label>
        </div>
    </div>
</Page>

<style>
    label {
        font-size: 1.5rem;
        padding-bottom: 0.5rem;
    }

    button {
        height: 2rem;
        width: 2rem;
    }

    .header {
        font-size: 1.5rem;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .icon {
        width: 32px;
        height: 32px;
    }
    .row {
        display: flex;
        flex-direction: row;
        width: 100%;
    }

    .group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 3rem;
    }

    .stretch {
        width: 100%;
    }
</style>
