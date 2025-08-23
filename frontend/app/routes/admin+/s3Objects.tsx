import { LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { getProblematicS3Objects } from "~/database/repositories/s3Objects.server";
import { loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request) => {
  const isInfrastructureAdminLoggedIn = await loggedInUserHasRole(
    request,
    Roles.InfrastructureAdmin,
  );

  if (!isInfrastructureAdminLoggedIn) {
    logger("admin-s3objects").warn(
      `Someone tried accessing the S3 objects information without authorization`,
    );
    throw redirect("/");
  }
})!;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);
  return { s3Objects: await getProblematicS3Objects() };
};

export const handle = {
  i18n: ["admin"],
};

export default function S3ObjectsAdmin() {
  const { t } = useTranslation("admin");
  const { s3Objects } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{t("s3objects.title")}</h1>
      <p>{t("s3objects.description")}</p>

      {s3Objects.length === 0 ? (
        <p>{t("s3objects.no-objects")}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t("s3objects.table.id")}</th>
              <th>{t("s3objects.table.key")}</th>
              <th>{t("s3objects.table.bucket")}</th>
              <th>{t("s3objects.table.status")}</th>
              <th>{t("s3objects.table.uploaded-at")}</th>
              <th>{t("s3objects.table.uploaded-by")}</th>
              <th>{t("s3objects.table.url")}</th>
              <th>{t("s3objects.table.attachment")}</th>
              <th>{t("s3objects.table.main-image-in")}</th>
              <th>{t("s3objects.table.image-of-user")}</th>
            </tr>
          </thead>
          <tbody>
            {s3Objects.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.key}</td>
                <td>{it.bucket}</td>
                <td>{it.status}</td>
                <td>{it.uploadedAt.toISOString()}</td>
                <td>{it.uploadedBy?.username || t("s3objects.unknown")}</td>
                <td>{it.url || t("s3objects.na")}</td>
                <td>{it.attachment?.id || t("s3objects.none")}</td>
                <td>{it.mainImageIn?.title || t("s3objects.none")}</td>
                <td>{it.imageOfUser?.username || t("s3objects.none")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
