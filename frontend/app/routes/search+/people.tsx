import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { LocalDate } from "~/components/date-rendering";
import { UserImage } from "~/components/user-image/user-image";
import { searchUsers } from "~/database/repositories/user.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { query } = getSearchQuery(new URL(request.url).searchParams);

  if (query === null || query.trim() === "") {
    const users = await searchUsers();
    return { users };
  }

  const users = await searchUsers(query.split(" "));
  return { users };
};

export const handle = {
  i18n: ["users"],
};

export default function Search() {
  const { users } = useLoaderData<typeof loader>();

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
            <UserImage {...user} />
          </li>
        ))}
      </ul>
    </main>
  );
}
