<script lang="ts">
  import CancelIcon from 'svelte-icons/fa/FaTimes.svelte';
  import EditIcon from 'svelte-icons/fa/FaEdit.svelte';
  import CheckIcon from 'svelte-icons/fa/FaCheck.svelte';

  import Menu from './Menu.svelte';

  export let title = 'Projektdoku ZAM';
  export let cancelHandler: () => void | null = null;
  export let submitHandler: () => void | null = null;
  export let editHandler: () => void | null = null;
</script>

<div class="page">
  <div class="scroll">
    <header>
      {#if cancelHandler !== null}
        <div class="icon" on:click={cancelHandler}>
          <CancelIcon />
        </div>
      {:else}
        <div class="icon" />
      {/if}

      <h1>{title}</h1>

      {#if editHandler !== null}
        <div class="icon" on:click={editHandler}>
          <EditIcon />
        </div>
      {:else}
        <div class="icon" />
      {/if}

      {#if submitHandler === null}
        <div class="icon">
          <Menu />
        </div>
      {:else}
        <div class="icon" on:click={submitHandler}>
          <CheckIcon />
        </div>
      {/if}
    </header>

    <main>
      <slot />
    </main>
  </div>

  {#if $$slots.footer}
    <div class="footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style type="text/scss">
  @import '../style/colors.scss';

  header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid $primary-light-color;
    height: 4rem;

    h1 {
      margin: 0;
      flex-grow: 1;
    }

    div.icon {
      height: 2rem;
      width: 2rem;
      margin-right: 1rem;
    }
  }

  .page {
    margin-left: auto;
    margin-right: auto;
    margin-top: 2rem;
    margin-bottom: 0;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-areas:
      'content'
      'footer';

    height: calc(100vh - 2rem);
    max-height: 740px;
    max-width: 1200px;
  }

  .scroll {
    display: grid;
    grid-template-rows: 60px 1fr;
    grid-template-areas:
      'header'
      'main';
    grid-area: content;
    padding: 0 1rem 0 1rem;

    overflow: auto;
  }

  .header {
    grid-area: header;
    // border-bottom: 1px solid #797979;
  }

  main {
    grid-area: main;
    margin-top: 40px;
  }

  .footer {
    grid-area: footer;
    height: 60px;
    background-color: rgba(242, 242, 242, 1);
  }
</style>
