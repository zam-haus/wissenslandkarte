// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { prisma } from "~/database/db.server";
import { logger } from "~/lib/logging.server";
import { getMeilisearchVersion } from "~/lib/search/search.server";
import { s3Client, s3Bucket } from "~/lib/storage/s3-client.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");

  const url = new URL("/", `http://${host}`);

  const promises = await Promise.allSettled([
    prisma.user.count(),

    fetch(url.toString(), { method: "HEAD" }).then((r) => {
      if (!r.ok) return Promise.reject(new Error("HTTP request failed"));
    }),

    getMeilisearchVersion(),

    s3Client.send(new HeadBucketCommand({ Bucket: s3Bucket })),
  ]);
  const statuses = promises.map((p) => p.status === "fulfilled");
  const statusesMessagesEmoji = statuses.map((p) => (p ? "✅" : "❌"));
  const statusesMessages = statuses.map((p) => (p ? "OK" : "ERROR"));
  const allGood = statuses.every((s) => s);
  const [database, http, meilisearch, s3] = statusesMessages;

  const status = {
    status: statusesMessagesEmoji.join(" ") + (allGood ? " OK" : " ERROR"),
    prisma: database,
    http: http,
    meilisearch: meilisearch,
    s3: s3,
  };

  if (allGood) {
    return new Response(JSON.stringify(status), { status: 200 });
  }
  logger("healthcheck").warn("Healthcheck failed", { status });
  return new Response(JSON.stringify(status), { status: 500 });
};
