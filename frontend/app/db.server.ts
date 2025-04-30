import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

type GlobalWithDb = typeof global & { __db__?: PrismaClient };

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  const globalWithDb = global as GlobalWithDb;
  if (!globalWithDb.__db__) {
    globalWithDb.__db__ = new PrismaClient();
  }
  prisma = globalWithDb.__db__;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  prisma.$connect();
}

export { prisma };
