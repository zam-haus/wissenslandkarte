import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { Handle } from "types/handle";
import { deleteUserById, getUserOverview } from "~/database/repositories/user.server";
import { isThisUserLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";
import { deleteUsersFromSearchIndex } from "~/lib/search/search.server";
import { deleteS3FilesByPublicUrl } from "~/lib/storage/s3Deletion.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request) => {
  const isUserAdminLoggedIn = await loggedInUserHasRole(request, Roles.UserEditor);

  if (!isUserAdminLoggedIn) {
    logger("user-delete").warn(`Unauthorized attempt to access user delete page`);
    throw redirect("/");
  }
})!;

export const action = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.username, `Missing username`);

  const user = await getUserOverview(params.username);
  assertExistsOr404(user, `User not found: ${params.username}`);

  await assertAuthorization(request);

  // Prevent self-deletion
  if (await isThisUserLoggedIn(request, user)) {
    logger("user-delete").warn(`User ${user.username} attempted to delete themselves`);
    return redirect(`/users/${encodeURIComponent(user.username)}/delete`);
  }

  if (user.ownedProjects.length > 0) {
    return redirect(`/users/${encodeURIComponent(user.username)}/delete`);
  }

  await deleteS3FilesByPublicUrl(user.image ? [user.image] : []);
  await deleteUsersFromSearchIndex([user.id]);
  await deleteUserById(user.id);

  return redirect(`?success=true&username=${encodeURIComponent(user.username)}`);
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.username, `Missing username`);

  const url = new URL(request.url);
  if (url.searchParams.get("success") === "true") {
    return { success: true, username: url.searchParams.get("username") ?? "" };
  }

  const user = await getUserOverview(params.username);
  assertExistsOr404(user, `User not found: ${params.username}`);

  await assertAuthorization(request);

  const cannotDeleteSelf = await isThisUserLoggedIn(request, user);

  return { user, cannotDeleteSelf };
};

export const handle: Handle<"users"> = {
  pageTitleOverride: { ns: "users", key: "titles.delete-user" },
};

export default function UserDelete() {
  const data = useLoaderData<typeof loader>();
  const { t } = useTranslation("users"); // reuse projects strings if needed

  if (data.success === true) {
    const username = (data as { username: string }).username;
    return (
      <div>
        <h2>{t("delete.user-deleted")}</h2>
        <p>{t("delete.user-deleted-message", { username })}</p>
        <Link to="/users">{t("delete.back-to-users")}</Link>
      </div>
    );
  }

  const { user, cannotDeleteSelf } = data;
  const projects = user?.ownedProjects ?? [];

  if (cannotDeleteSelf) {
    return (
      <div>
        <h2>{t("delete.cannot-delete-title", { username: user.username })}</h2>
        <p>{t("delete.cannot-delete-self")}</p>
      </div>
    );
  }

  if (projects.length > 0) {
    return (
      <div>
        <h2>{t("delete.cannot-delete-title", { username: user?.username })}</h2>
        <p>{t("delete.cannot-delete-message")}</p>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${encodeURIComponent(p.id)}`}>{p.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Form method="post">
      <p>{t("delete.confirmation-prompt", { username: user?.username })}</p>
      <button type="submit">{t("delete.confirmation-response-yes")}</button>
    </Form>
  );
}
