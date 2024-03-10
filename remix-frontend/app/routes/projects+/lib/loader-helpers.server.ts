import { getTagList } from "~/models/tags.server";
import { getUserListFiltered } from "~/models/user.server";

export function loaderForUserFetcher(params: URLSearchParams) {
  const usersFilter = params.get("usersFilter") ?? "";
  const ignoreUsers = Boolean(params.get("ignoreUsers") ?? false);

  return ignoreUsers ? Promise.resolve([]) : getUserListFiltered(usersFilter);
}

export function loaderForTagFetcher(params: URLSearchParams) {
  const tagsFilter = params.get("tagsFilter") ?? "";
  const ignoreTags = Boolean(params.get("ignoreTags") ?? false);

  return ignoreTags ? Promise.resolve([]) : getTagList({ count: "projects", filter: tagsFilter });
}
