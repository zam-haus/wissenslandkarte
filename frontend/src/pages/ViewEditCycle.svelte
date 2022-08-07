<script lang="ts">
  import ViewEdit from '../layout/ViewEdit.svelte';
  import { wait } from '../lib/util';

  async function onSubmit() {
    console.log('submitting...');
    await wait(500);
    console.log('done!');
  }
</script>

<ViewEdit title="view-edit" {onSubmit}>
  <div slot="view">viewing this stuff</div>

  <div slot="edit">editing this stuff</div>
</ViewEdit>
