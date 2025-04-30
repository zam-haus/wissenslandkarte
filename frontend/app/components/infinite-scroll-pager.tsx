import type { useLoaderData } from "@remix-run/react";
import { Link, useFetcher } from "@remix-run/react";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";

export function Pager({
  page,
  hasMore,
  t,
}: {
  page: number;
  hasMore: boolean;
  t: TFunction<"common">;
}) {
  return (
    <>
      {page === 0 ? null : <Link to={`?page=${page - 1}`}>{t("prev-page")}</Link>}
      {!hasMore ? null : <Link to={`?page=${page + 1}`}>{t("next-page")}</Link>}
    </>
  );
}

/**
 * `convert` must be guarded with `useCallback`!
 */
type Paged<D> = { pageData: D[]; page: number };
export function usePagedInfinitScroll<
  A,
  B = A,
  PA extends Paged<A> = Paged<A>,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  PB extends Paged<B> = Paged<B>,
  LPA extends ReturnType<typeof useLoaderData<PA>> = ReturnType<typeof useLoaderData<PA>>,
  FPA extends ReturnType<typeof useFetcher<PA>> = ReturnType<typeof useFetcher<PA>>,
>(initialData: LPA, convert: (t: LPA | NonNullable<FPA["data"]>) => PB) {
  const { pageData: initialPageData, page: initialPage } = convert(initialData);
  const [pageData, setPageData] = useState<B[]>(initialPageData);
  const fetcher = useFetcher<PA>();

  const [page, setPage] = useState(initialPage);
  const [hasFetched, setHasFetched] = useState(false);

  const hasMore = hasFetched
    ? fetcher.data !== undefined && fetcher.data.pageData.length > 0
    : initialPageData.length > 0;

  useEffect(() => {
    if (!fetcher.data || fetcher.state === "loading") {
      return;
    }

    const fetchedData = convert(fetcher.data);
    const newProjects = fetchedData.pageData;
    setPageData((pageData) => [...pageData, ...newProjects]);
    setPage(fetchedData.page);
    setHasFetched(true);
  }, [fetcher.data, fetcher.state, setPage, setHasFetched, convert]);

  return { pageData, page, hasMore, fetcher };
}
