<script>
    import { navigate } from "svelte-navigator";
    import { fly } from "svelte/transition";

    import Bars from "svelte-icons/fa/FaBars.svelte";
    import ChevronRight from "svelte-icons/fa/FaChevronRight.svelte";
    import Home from "svelte-icons/fa/FaHome.svelte";

    let open = false;

    function openMenu() {
        open = true;
    }

    function closeMenu() {
        open = false;
    }

    function goto(path) {
        closeMenu();
        navigate(path);
    }
</script>

<div class="menu">
    <div class="main-icon" on:click={openMenu}>
        <Bars />
    </div>

    {#if open}
        <div
            class="slide-in"
            transition:fly={{ x: 250, duration: 250, opacity: 1 }}
        >
            <nav>
                <ul>
                    <li class="back" on:click={closeMenu}>
                        <div><ChevronRight /></div>
                    </li>
                    <li on:click={() => goto("/")}>
                        <div class="icon"><Home /></div>
                         Startseite
                    </li>
                    <li on:click={() => goto("/profile")}>Profile</li>
                    <li on:click={() => goto("/projects")}>Projects</li>
                    <li on:click={() => goto("/resources")}>Resources</li>
                    <li on:click={() => goto("/sample")}>SamplePage</li>
                    <li on:click={() => goto("/viewedit")}>ViewEditCycle</li>
                    <li on:click={() => goto("/newProject")}>New Project</li>
                </ul>
            </nav>
        </div>
    {/if}
</div>

<style type="text/scss">
    @import "../style/colors.scss";

    .menu {
        position: relative;
    }

    .main-icon {
        height: 2rem;
    }

    .slide-in {
        position: absolute;
        top: 0;
        right: 0;
        background: $primary-light-color;
        width: 8rem;

        ul {
            list-style-type: none;
            margin-left: -20px;
            margin: 0;
            padding: 0;

            li {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                padding: 0.3rem;
                font-size: 0.8rem;
                border-bottom: 1px solid $dark-color;
                color: $primary-color;
                cursor: pointer;

                &.back {
                    padding-right: 0.5rem;

                    div {
                        width: 0.8rem;
                        margin-left: auto;
                        margin-right: 0;
                        color: $dark-color;
                    }
                }

                .icon {
                    width: 1rem;
                    margin: 0 0.5rem;
                }

                &:last-child {
                    border-bottom: none;
                }
            }
        }
    }
</style>
