import { prisma } from "~/database/db.server";

const Keys = {
  searchIndexOutdated: "search-index-outdated",
} as const;

export async function setSearchIndexOutdated(isOutdated: boolean) {
  await prisma.keyValue.upsert({
    where: { key: Keys.searchIndexOutdated },
    create: { key: Keys.searchIndexOutdated, value: JSON.stringify(isOutdated) },
    update: { value: JSON.stringify(isOutdated) },
  });
}
