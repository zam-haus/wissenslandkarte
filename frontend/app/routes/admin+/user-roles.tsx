import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { UNSAFE_DataWithResponseInit as DataWithResponseInit } from "@remix-run/router";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { roles } from "prisma/initialization/data/production-data-generators";
import {
  getUsersWithSpecialRoles,
  getUserWithRoles,
  setUserRoles,
} from "~/database/repositories/user.server";
import {
  isThisUserLoggedIn,
  loggedInUserHasRole,
  Roles,
  type UserWithRoles,
} from "~/lib/authorization.server";
import { getStringArray, getStringsDefaultUndefined } from "~/lib/formDataParser";
import { logger } from "~/lib/logging.server";
import { getSession } from "~/lib/session.server";
import { useState } from "react";

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

const USERNAME_REQUIRED = "USERNAME_REQUIRED";
const INVALID_ROLES = "INVALID_ROLES";
const USER_NOT_FOUND = "USER_NOT_FOUND";
const UPDATE_FAILED = "UPDATE_FAILED";
const CANNOT_REMOVE_ROLE_MANAGER = "CANNOT_REMOVE_ROLE_MANAGER";

type ActionSuccess = { success: true };
type ActionError = {
  success: false;
  error:
    | typeof USERNAME_REQUIRED
    | typeof INVALID_ROLES
    | typeof USER_NOT_FOUND
    | typeof UPDATE_FAILED
    | typeof CANNOT_REMOVE_ROLE_MANAGER;
};

type ActionResult = ActionSuccess | ActionError;

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<DataWithResponseInit<ActionSuccess> | ActionResult> => {
  await assertAuthorization(request);

  const formData = await request.formData();
  const { username } = getStringsDefaultUndefined(formData, "username");
  const { role: selectedRoles } = getStringArray(formData, "role");

  if (username === undefined || username.trim() === "") {
    return { success: false, error: USERNAME_REQUIRED };
  }

  const hasInvalidRoles = selectedRoles.some(
    (role) => !(roles as readonly string[]).includes(role),
  );
  if (hasInvalidRoles) {
    return { success: false, error: INVALID_ROLES };
  }

  try {
    const currentUser = await getUserWithRoles(username);
    if (currentUser === null) {
      return { success: false, error: USER_NOT_FOUND };
    }

    const isEditingSelf = await isThisUserLoggedIn(request, currentUser);
    const roleManagerRoleRemoved = !selectedRoles.includes(Roles.RoleManager);
    if (isEditingSelf && roleManagerRoleRemoved) {
      return { success: false, error: CANNOT_REMOVE_ROLE_MANAGER };
    }

    const updatedUser = await setUserRoles(username, selectedRoles);

    if (isEditingSelf) {
      const session = await getSession(request);
      session.set("user", updatedUser);
      const headers = await session.commit();
      return data({ success: true }, { headers });
    }

    return { success: true };
  } catch (error) {
    logger("admin-user-roles").error("Error setting user roles", {
      error,
      username,
      selectedRoles,
    });
    return { success: false, error: UPDATE_FAILED };
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);
  const usersWithRoles = await getUsersWithSpecialRoles();
  return { usersWithRoles, availableRoles: roles };
};

export default function UserRolesManagement() {
  const { t } = useTranslation("admin");
  const { usersWithRoles, availableRoles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const errorMessage =
    actionData?.success === false ? (
      <div>
        {actionData.error === USERNAME_REQUIRED ? t("user-roles.username-required") : null}
        {actionData.error === INVALID_ROLES ? t("user-roles.invalid-roles") : null}
        {actionData.error === USER_NOT_FOUND ? t("user-roles.user-not-found") : null}
        {actionData.error === UPDATE_FAILED ? t("user-roles.update-failed") : null}
        {actionData.error === CANNOT_REMOVE_ROLE_MANAGER
          ? t("user-roles.cannot-remove-role-manager")
          : null}
      </div>
    ) : null;

  const successMessage =
    actionData?.success === true ? <div>{t("user-roles.update-success")}</div> : null;

  return (
    <div>
      <h1>{t("user-roles.title")}</h1>

      {successMessage}
      {errorMessage}

      <AddNewUserSection availableRoles={availableRoles} />
      <ExistingUsersSection usersWithRoles={usersWithRoles} availableRoles={availableRoles} />
    </div>
  );
}

function AddNewUserSection({ availableRoles }: { availableRoles: readonly string[] }) {
  const { t } = useTranslation("admin");
  const [newUser, setNewUser] = useState<string>("");

  return (
    <div>
      <h2>{t("user-roles.grant-role-to-user")}</h2>
      <input type="text" value={newUser} onChange={(e) => setNewUser(e.target.value)} />

      {newUser ? (
        <UsersRolesTable availableRoles={availableRoles}>
          <UserRoleRow
            user={{ username: newUser, roles: [] }}
            availableRoles={availableRoles}
            formId={`form-new-${newUser}`}
          />
          <Form
            key={`form-new-${newUser}`}
            id={`form-new-${newUser}`}
            method="POST"
            action=""
            onSubmit={() => setNewUser("")}
          />
        </UsersRolesTable>
      ) : null}
    </div>
  );
}

function ExistingUsersSection({
  usersWithRoles,
  availableRoles,
}: {
  usersWithRoles: UserWithRoles[];
  availableRoles: readonly string[];
}) {
  const { t } = useTranslation("admin");

  return (
    <div>
      <h2>{t("user-roles.users-with-roles")}</h2>
      {usersWithRoles.length === 0 ? (
        <p>{t("user-roles.no-users")}</p>
      ) : (
        <>
          <UsersRolesTable availableRoles={availableRoles}>
            {usersWithRoles.map((user) => (
              <UserRoleRow
                key={user.username}
                user={user}
                availableRoles={availableRoles}
                formId={`form-${user.username}`}
              />
            ))}
          </UsersRolesTable>
          {usersWithRoles.map((user) => (
            <Form key={user.username} id={`form-${user.username}`} method="POST" action="" />
          ))}
        </>
      )}
    </div>
  );
}

function UsersRolesTable({
  children,
  availableRoles,
}: {
  children: React.ReactNode;
  availableRoles: readonly string[];
}) {
  const { t } = useTranslation("admin");

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>{t("user-roles.username")}</th>
            {availableRoles.map((role) => (
              <th key={role}>{role}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </>
  );
}

function UserRoleRow({
  user,
  availableRoles,
  formId,
}: {
  user: Pick<UserWithRoles, "username" | "roles">;
  availableRoles: readonly string[];
  formId: string;
}) {
  const { t } = useTranslation("admin");

  const userRoles = user.roles.map((role) => role.title);

  return (
    <>
      <tr key={user.username}>
        <td>
          {user.username}
          <input form={formId} type="hidden" name="username" value={user.username} />
        </td>
        {availableRoles.map((role) => {
          const hasRole = userRoles.includes(role);
          return (
            <td key={role}>
              <input
                form={formId}
                type="checkbox"
                name="role"
                value={role}
                defaultChecked={hasRole}
              />
            </td>
          );
        })}
        <td>
          <button form={formId} type="submit">
            {t("user-roles.save-roles")}
          </button>
        </td>
      </tr>
    </>
  );
}
