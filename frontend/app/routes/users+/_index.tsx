import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroll-component";

import { Pager, usePagedInfinitScroll } from "~/components/infinite-scroll-pager";
import { UserImage } from "~/components/users/user-image";
import type { UserListEntry } from "~/models/user.server";
import { getUserList } from "~/models/user.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const parsedPage = parseInt(url.searchParams.get("page") || "0", 10);
  const page = isNaN(parsedPage) ? 0 : parsedPage;

  return {
    pageData: await getUserList({ image: true }, { limit: 30, page }),
    page,
  };
};

export default function Users() {
  const { t } = useTranslation("common");
  const loaderData = useLoaderData<typeof loader>();

  const {
    pageData: users,
    page,
    hasMore,
    fetcher,
  } = usePagedInfinitScroll<Omit<UserListEntry, "registrationDate">>(
    loaderData,
    useCallback((loadedData) => loadedData, []),
  );

  const loadMore = () => {
    // without this ?index fetcher loads from the loader located at _layout.tsx
    // see also https://github.com/kiliman/remix-flat-routes/issues/116
    fetcher.load(`${location.pathname}?index&page=${page + 1}`);
  };

  return (
    <InfiniteScroll
      scrollableTarget="globalScrollContainer"
      next={loadMore}
      loader={t("loading-more")}
      dataLength={users.length}
      hasMore={hasMore}
    >
      <main>
        <h1>Users</h1>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <Link to={encodeURIComponent(user.username)}>
                {user.image === undefined ? null : (
                  <UserImage image={user.image} username={user.username} t={t} />
                )}
                {user.username}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Pager page={page} hasMore={hasMore} t={t}></Pager>
    </InfiniteScroll>
  );
}
