import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { roles } from "prisma/initialization/data/production-data-generators";
import {
  addRoleToUser,
  getUsersWithSpecialRoles,
  getUserWithRoles,
  removeRoleFromUser,
} from "~/database/repositories/user.server";
import { loggedInUserHasRole, Roles, type UserWithRoles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request) => {
  const isRoleManagerLoggedIn = await loggedInUserHasRole(request, Roles.RoleManager);

  if (!isRoleManagerLoggedIn) {
    logger("admin-user-roles").warn(
      `Someone tried accessing the user roles management without authorization`,
    );
    throw redirect("/");
  }
})!;

export const action = async ({ request }: ActionFunctionArgs) => {
  await assertAuthorization(request);

  const formData = await request.formData();
  const username = formData.get("username") as string;
  const selectedRoles = formData.getAll("role") as string[];

  // Validate input
  if (!username) {
    return json({ error: "Username is required" }, { status: 400 });
  }

  // Validate that all selected roles are valid
  const invalidRoles = selectedRoles.filter((role) => !roles.includes(role as any));
  if (invalidRoles.length > 0) {
    return json({ error: `Invalid roles: ${invalidRoles.join(", ")}` }, { status: 400 });
  }

  try {
    // Get current user roles to determine what needs to be added/removed
    const currentUser = await getUserWithRoles(username);
    if (!currentUser) {
      return json({ error: `User ${username} not found` }, { status: 404 });
    }

    const currentRoles = currentUser.roles.map((role) => role.title);
    const rolesToAdd = selectedRoles.filter((role) => !currentRoles.includes(role));
    const rolesToRemove = currentRoles.filter((role) => !selectedRoles.includes(role));

    // Apply role changes
    for (const role of rolesToAdd) {
      await addRoleToUser(username, role);
    }

    for (const role of rolesToRemove) {
      await removeRoleFromUser(username, role);
    }

    const changes = [];
    if (rolesToAdd.length > 0) {
      changes.push(`Added: ${rolesToAdd.join(", ")}`);
    }
    if (rolesToRemove.length > 0) {
      changes.push(`Removed: ${rolesToRemove.join(", ")}`);
    }

    const message =
      changes.length > 0
        ? `Updated roles for ${username}: ${changes.join("; ")}`
        : `No changes made for ${username}`;

    return json({ success: message });
  } catch (error) {
    logger("admin-user-roles").error("Error managing user roles", {
      error,
      username,
      selectedRoles,
    });
    return json({ error: "Failed to update user roles" }, { status: 500 });
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);
  const usersWithRoles = await getUsersWithSpecialRoles();
  return { usersWithRoles, availableRoles: roles };
};

// Component for individual user role row
function UserRoleRow({
  user,
  availableRoles,
  formId,
}: {
  user: UserWithRoles;
  availableRoles: readonly string[];
  formId: string;
}) {
  const { t } = useTranslation("admin");

  const userRoles = user.roles.map((role) => role.title);

  return (
    <tr key={user.id}>
      <td>
        {user.username}
        <input form={formId} type="hidden" name="username" value={user.username} />
      </td>
      {availableRoles.map((role) => {
        const hasRole = userRoles.includes(role);
        return (
          <td key={role}>
            <input form={formId} type="checkbox" name="role" value={role} checked={hasRole} />
          </td>
        );
      })}
      <td>
        <button form={formId} type="submit">
          {t("user-roles.save-roles")}
        </button>
      </td>
    </tr>
  );
}

export default function UserRolesManagement() {
  const { t } = useTranslation("admin");
  const { usersWithRoles, availableRoles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h1>{t("user-roles.title")}</h1>

      {actionData && "error" in actionData ? <div>{actionData.error}</div> : null}

      {actionData && "success" in actionData ? <div>{actionData.success}</div> : null}

      <div>
        <h2>{t("user-roles.users-with-roles")}</h2>
        {usersWithRoles.length === 0 ? (
          <p>{t("user-roles.no-users")}</p>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>{t("user-roles.username")}</th>
                  {availableRoles.map((role) => (
                    <th key={role}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersWithRoles.map((user) => (
                  <UserRoleRow
                    key={user.id}
                    user={user}
                    availableRoles={availableRoles}
                    formId={`form-${user.id}`}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {usersWithRoles.map((user) => (
          <Form key={user.id} id={`form-${user.id}`} action=""></Form>
        ))}
      </div>
    </div>
  );
}
