import { prisma } from "~/db.server";

export async function getTagList() {
  return prisma.tag.findMany({
    select: {
      id: true,
      name: true,
    },
  });
}
