import { getTagList } from "~/models/tags.server";
import { getUserListFiltered } from "~/models/user.server";

export function loaderForUserFetcher(params: URLSearchParams) {
  const usersFilter = params.get("usersFilter") ?? "";
  const ignoreUsers = Boolean(params.get("ignoreUsers") ?? false);

  return ignoreUsers ? Promise.resolve([]) : getUserListFiltered(usersFilter);
}

export async function lowLevelTagLoader(filter: string | null) {
  const tags = await getTagList({ count: "projects", filter: filter ?? "" });
  const prioritizedTags = tags.map(({ id, name, _count }) => ({
    id,
    name,
    priority: _count.projects ?? 0,
  }));

  return { tags: prioritizedTags };
}
