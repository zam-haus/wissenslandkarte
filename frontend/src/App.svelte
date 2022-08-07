<script lang="ts">
    import { Route, Router } from 'svelte-navigator';
    import '../style/style.scss';
    import Home from './pages/Home.svelte';
    import NewProject from './pages/NewProject.svelte';
    import LoggedInUserProfile from './pages/profile/LoggedInUserProfile.svelte';
    import UserProfileById from './pages/profile/UserProfileById.svelte';
    import Projects from './pages/Projects.svelte';
    import Resources from './pages/Resources.svelte';
    import SamplePage from './pages/SamplePage.svelte';
    import ViewEditCycle from './pages/ViewEditCycle.svelte';
    import { isI18nLoading } from './services/i18n';
</script>

{#if !$isI18nLoading}
    <Router>
        <Route path="/">
            <Home />
        </Route>

        <Route path="/profile/me">
            <LoggedInUserProfile />
        </Route>

        <Route path="/profile/:userId" let:params>
            <UserProfileById userId={parseInt(params.userId, 10)} />
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
