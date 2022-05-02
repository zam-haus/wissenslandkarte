<script lang="ts">
    import { Router, Route } from "svelte-navigator";

    import Home from "./pages/Home.svelte";
    import Profile from "./pages/Profile.svelte";
    import SamplePage from "./pages/SamplePage.svelte";
    import Projects from "./pages/Projects.svelte";
    import Resources from "./pages/Resources.svelte";
    import ViewEditCycle from "./pages/ViewEditCycle.svelte";
    import NewProject from "./pages/NewProject.svelte";

    import { userStore } from "./stores/user";
    import { isI18nLoading, _ } from "./services/i18n";

    import "../style/style.scss";
</script>

{#if !$isI18nLoading}
    <Router>
        <Route path="/">
            <Home />
        </Route>

        <Route path="/profile">
            <Profile />
        </Route>

        <Route path="/projects">
            <Projects />
        </Route>

        <Route path="/resources">
            <Resources />
        </Route>

        <Route path="/sample">
            <SamplePage />
        </Route>

        <Route path="/viewedit">
            <ViewEditCycle />
        </Route>

        <Route path="/newProject">
            <NewProject />
        </Route>
    </Router>
{/if}