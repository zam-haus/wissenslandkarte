<script>
  import Page from '../layout/Page.svelte';
  import { _ } from '../services/i18n';
  import { loggedInUserStore } from '../stores/loggedInUserStore';
</script>

<Page>
  {#if $loggedInUserStore}
    <h1>
      {$_('app.greeting', {
        values: { name: $loggedInUserStore.firstName },
      })}
    </h1>
  {/if}
</Page>
