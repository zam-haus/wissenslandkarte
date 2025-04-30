import { getTagList } from "~/models/tags.server";
import { getUserListFiltered } from "~/models/user.server";

export async function lowLevelUserLoader(filter: string | null) {
  return { users: await getUserListFiltered(filter ?? "") };
}

export async function lowLevelTagLoader(filter: string | null) {
  const tags = await getTagList({ count: "projects", filter: filter ?? "" });
  const prioritizedTags = tags.map(({ id, name, _count }) => ({
    id,
    name,
    priority: _count.projects,
  }));

  return { tags: prioritizedTags };
}
