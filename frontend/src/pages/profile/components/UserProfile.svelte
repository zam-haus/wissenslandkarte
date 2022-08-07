<script lang="ts">
  import { date } from 'svelte-i18n';
  import EnvelopeIcon from 'svelte-icons/fa/FaEnvelope.svelte';
  import type {
    CurrentUserDTO,
    UserDTO,
  } from '../../../../../mock-backend/mocks/models/user';
  import { _ } from '../../../services/i18n';

  export let user: UserDTO | CurrentUserDTO;
</script>

<header>
  <img
    src={user.image}
    alt={$_('app.profile.imageAltText')}
    class="userImage atRight"
  />
  <h3>
    {user.username}
  </h3>

  <p>
    {$_('app.profile.projects', {
      values: {
        count: user.projectsShortInfo.length,
      },
    })}
  </p>

  <p>
    {$_('app.profile.registration', {
      values: {
        date: $date(new Date(user.registrationDate), {
          format: 'medium',
        }),
      },
    })}
  </p>
</header>

<p class="fullWidth">
  {user.description}
</p>

<button class="primary send-message" on:click={() => console.log('message')}>
  <div class="icon"><EnvelopeIcon /></div>
  {$_('app.profile.sendMessage')}
</button>

<ul class="tag-list">
  {#each user.tags as tag}
    <li>{tag}</li>
  {/each}
</ul>

<div>Projekte kommen hier...</div>

<style>
  /* TODO: css at top or botttom? */
  .userImage {
    margin: 15px;
    margin-top: 0;
    border-radius: 50%;
    border: 1px solid red;
  }

  .atRight {
    float: right;
  }

  .fullWidth {
    clear: both;
  }

  .tag-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    margin-top: 15px;
  }

  .tag-list li {
    border-radius: 10px;
    background: white;
    margin: 5px 10px;
    padding: 2px 10px;
  }

  .send-message {
    margin: 30px;
    align-self: center;
  }
</style>
