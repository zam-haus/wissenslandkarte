import { prisma } from "~/db.server";

export async function getTagList({
  count,
  filter,
}: {
  filter: string;
  count: "projects" | "users";
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
