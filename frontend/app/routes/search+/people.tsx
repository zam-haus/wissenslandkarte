import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { UserList } from "~/components/user/user-list";
import { getUserList, getUsersByIds, UserListEntry } from "~/database/repositories/user.server";
import { logger } from "~/lib/logging.server";
import { searchUserInSearchIndex } from "~/lib/search/search.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const { query, tagFilter } = getSearchQuery(searchParams);

  function filterByTags(users: UserListEntry[]) {
    return tagFilter.length === 0
      ? users
      : users.filter((user) =>
          tagFilter.every((tag) => user.tags.map((it) => it.name).includes(tag)),
        );
  }

  if (query === null || query.trim() === "") {
    const users = filterByTags(await getUserList({ limit: 50 }));
    return { users, searchError: null };
  }

  try {
    const userResults = await searchUserInSearchIndex(query);
    const userIds = userResults.hits.map(({ id }) => id);
    const foundUsers = await getUsersByIds(userIds);
    return { users: filterByTags(foundUsers), searchError: null };
  } catch (error) {
    logger("user-search").error("Search service unavailable:", error);
    const users = filterByTags(await getUserList({ limit: 50 }));
    return { users, searchError: "search-unavailable" };
  }
};

export const handle = {
  i18n: ["users"],
};

export default function Search() {
  const { users, searchError } = useLoaderData<typeof loader>();
  const { t } = useTranslation("search");

  return (
    <main>
      <SearchProjectPeopleSwitch />
      <SearchForm />
      {searchError ? (
        <div className="error small-padding small-round min margin">
          <i>error</i>
          <span>{t("search-error")}</span>
        </div>
      ) : null}
      <UserList users={users} />
    </main>
  );
}
