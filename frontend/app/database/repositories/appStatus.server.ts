import { prisma } from "~/database/db.server";

import { NO_REBUILD_IN_PROGRESS } from "./appStatusEnums";

const Keys = {
  searchIndexOutdated: "search-index-outdated",
  searchIndexRebuildProgress: "search-index-rebuild-progress",
  totalEntriesToRebuild: "total-entries-to-rebuild",
} as const;

export async function setSearchIndexOutdated(isOutdated: boolean) {
  await storeValue(Keys.searchIndexOutdated, isOutdated);
}

export async function isSearchIndexOutdated() {
  return getValue(Keys.searchIndexOutdated, false, validateBoolean);
}

export async function setSearchIndexRebuildProgress(progress: number) {
  await storeValue(Keys.searchIndexRebuildProgress, progress);
}

export async function getSearchIndexRebuildProgress() {
  return getValue(Keys.searchIndexRebuildProgress, NO_REBUILD_IN_PROGRESS, validateNumber);
}

export async function setTotalEntriesToRebuild(total: number) {
  await storeValue(Keys.totalEntriesToRebuild, total);
}

export async function getTotalEntriesToRebuild() {
  return getValue(Keys.totalEntriesToRebuild, 0, validateNumber);
}

function storeValue(key: string, value: unknown) {
  return prisma.keyValue.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
}

async function getValue<T>(
  key: string,
  defaultValue: T,
  validator: (value: unknown) => value is T,
) {
  const result = await prisma.keyValue.findUnique({
    where: { key },
  });

  if (result === null) {
    return defaultValue;
  }

  const parsedValue = JSON.parse(result.value) as unknown;
  if (!validator(parsedValue)) {
    throw new Error(`Invalid value in key-value storefor key ${key}`);
  }

  return parsedValue;
}

function validateBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function validateNumber(value: unknown): value is number {
  return typeof value === "number";
}
