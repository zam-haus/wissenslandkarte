import { execSync } from "child_process";
import { existsSync } from "fs";
import process from "process";

import { PrismaClient } from "../../prisma/generated";

import { seedTestData } from "./test-data";

let prisma: PrismaClient | undefined;

const DB_FILENAME = "test.db";
const TEST_DB_PATH = `./prisma/${DB_FILENAME}`;
const CLEAN_DB_FILENAME = "test-clean.db";
const CLEAN_TEST_DB_PATH = `./prisma/${CLEAN_DB_FILENAME}`;
export const DATABASE_URL = `file:${DB_FILENAME}`;

export async function setupTestDatabase() {
  // Set test database URL
  process.env.DATABASE_URL = DATABASE_URL;

  if (copyCleanDbBackup()) {
    return;
  }

  console.log(`Removing existing test database at ${TEST_DB_PATH}`);
  try {
    execSync(`rm -f ${TEST_DB_PATH}`, { stdio: "inherit" });
  } catch {
    // Ignore if file doesn't exist
  }

  console.log("Generating Prisma client");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("Creating database and applying migrations");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: DATABASE_URL },
  });

  // Initialize Prisma client
  prisma = new PrismaClient();

  console.log("Seeding test data");
  await seedTestData(prisma);

  execSync(`cp ${TEST_DB_PATH} ${CLEAN_TEST_DB_PATH}`, { stdio: "inherit" });

  return prisma;
}

export async function cleanupTestDatabase() {
  if (copyCleanDbBackup()) {
    return;
  }
  await setupTestDatabase();
}

function copyCleanDbBackup() {
  if (existsSync(CLEAN_TEST_DB_PATH)) {
    console.log(`Found clean db backup at ${CLEAN_TEST_DB_PATH}, copying to ${TEST_DB_PATH}`);
    execSync(`cp ${CLEAN_TEST_DB_PATH} ${TEST_DB_PATH}`, { stdio: "inherit" });
    return true;
  }
  return false;
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  await setupTestDatabase();
}
