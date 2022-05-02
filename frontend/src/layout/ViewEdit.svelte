<script lang="ts">
    import Page from "./Page.svelte";

    export let title: string = ''
    export let onSubmit: () => Promise<void>

    let cancelHandler = null
    let editHandler = enterEditMode
    let submitHandler = null

    type mode = 'view' | 'edit'
    let mode: mode = 'view'

    function enterEditMode() {
        mode = 'edit'
        cancelHandler = enterViewMode
        editHandler = null
        submitHandler = execute
    }

    function enterViewMode() {
        mode = 'view'
        editHandler = enterEditMode
        cancelHandler = null
        submitHandler = null
    }

    async function execute() {
        await onSubmit()
        
        enterViewMode()
    }
</script>

<Page {title} {cancelHandler} {editHandler} {submitHandler}>
    {#if mode === 'view'}
        <slot name="view"></slot>
    {:else}
        <slot name="edit"></slot>
    {/if}
</Page>