import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { LocalDate } from "~/components/date-rendering";
import { UserImage } from "~/components/users/user-image";
import { searchUsers } from "~/models/user.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderArgs) => {
  const { query } = getSearchQuery(new URL(request.url).searchParams);

  if (query === null || query.trim() === "") {
    const users = await searchUsers();
    return json({ users });
  }

  const users = await searchUsers(query.split(" "));
  return json({ users });
};

export const handle = {
  i18n: ["search", "users"],
};

export default function Search() {
  const { users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("users");

  return (
    <main>
      <SearchForm />
      <SearchProjectPeopleSwitch />
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link to={`/users/${encodeURIComponent(user.username)}`}>{user.username}</Link>
            <span>
              <LocalDate date={user.registrationDate}></LocalDate>
            </span>
            <UserImage {...user} t={t} />
          </li>
        ))}
      </ul>
    </main>
  );
}
