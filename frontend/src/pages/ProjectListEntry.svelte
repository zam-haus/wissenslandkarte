<script lang="ts">
  import { date } from 'svelte-i18n';

  import { _ } from '../services/i18n';
  import type { ProjectDTO } from '../../mock-backend/mocks/models/project';

  export let project: ProjectDTO;

  export let width = 100;
  export let height = 100;
</script>

<div class="container">
  <div class="text-content">
    <div class="title">{project.title}</div>
    <div class="created-date">
      {$_('app.last_update')}
      {$date(project.latestModificationDate, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })}
    </div>
  </div>
  <div class="main-photo">
    <img
      src={project.mainPhoto}
      {width}
      {height}
      alt={`Image for ${project.title}`}
    />
  </div>
</div>

<style>
  .container {
    display: grid;
    grid-template-columns: 1fr 100px;
  }

  .text-content {
    display: grid;
    grid-template-rows: 1fr 1fr;
  }

  .title {
    text-transform: capitalize;
    margin-bottom: 5px;
  }
</style>
