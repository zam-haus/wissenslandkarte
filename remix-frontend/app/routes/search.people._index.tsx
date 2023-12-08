import { useTranslation } from 'react-i18next';
import { LocalDate } from '~/components/date-rendering';
import { getSearchQuery, SearchForm } from '~/components/search/search-form';
import { SearchProjectPeopleSwitch } from '~/components/search/search-header';
import { searchUsers } from '~/models/user.server';

import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import type { LoaderArgs } from '@remix-run/node';
export const loader = async ({
  request,
}: LoaderArgs) => {
  const query = getSearchQuery(request)

  if (query === null || query.trim() === '') {
    const users = await searchUsers()
    return json({ users });
  }

  const users = await searchUsers(query.split(" "));
  return json({ users })
};

export const handle = {
  i18n: ["common", "search", "users"],
};

export default function Search() {
  const { users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("search")

  return <main>
    <SearchForm />
    <SearchProjectPeopleSwitch />
    <ul>{users.map((user) =>
      <li key={user.id}>
        <Link to={`/users/${encodeURIComponent(user.username)}`} >{user.username}</Link>
        <span >
          <LocalDate date={user.registrationDate}></LocalDate>
        </span>
        <img alt={t("user-image-alt-text", { username: user.username })} src={user.image} />
      </li>
    )}
    </ul>
  </main>
}