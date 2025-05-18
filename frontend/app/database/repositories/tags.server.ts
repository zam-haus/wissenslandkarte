import { prisma } from "~/database/db.server";

export async function getTagList<Count extends "projects" | "users">({
  count,
  filter,
}: {
  filter: string;
  count: Count;
}) {
  return prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { [count]: true } as { [key in typeof count]?: true },
      },
    },
    where: { name: { contains: filter } },
    orderBy: { [count]: { _count: "desc" } },
    take: 50,
  });
}
