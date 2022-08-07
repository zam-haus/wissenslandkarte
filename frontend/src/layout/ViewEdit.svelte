<script lang="ts">
  import Page from './Page.svelte';

  export let title = '';
  export let onSubmit: () => Promise<void>;

  let cancelHandler = null;
  let editHandler = enterEditMode;
  let submitHandler = null;

  type Mode = 'view' | 'edit';
  let mode: Mode = 'view';

  function enterEditMode() {
    mode = 'edit';
    cancelHandler = enterViewMode;
    editHandler = null;
    submitHandler = execute;
  }

  function enterViewMode() {
    mode = 'view';
    editHandler = enterEditMode;
    cancelHandler = null;
    submitHandler = null;
  }

  async function execute() {
    await onSubmit();

    enterViewMode();
  }
</script>

<Page {title} {cancelHandler} {editHandler} {submitHandler}>
  {#if mode === 'view'}
    <slot name="view" />
  {:else}
    <slot name="edit" />
  {/if}
</Page>
