import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { UserList } from "~/components/user/user-list";
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
      <SearchProjectPeopleSwitch />
      <SearchForm />
      <UserList users={users} />
    </main>
  );
}
