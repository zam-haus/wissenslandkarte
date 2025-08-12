import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/server-runtime";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { serverOnly$ } from "vite-env-only/macros";
import { useTranslation } from "react-i18next";

import { addRoleToUser, getUsersWithSpecialRoles, removeRoleFromUser } from "~/database/repositories/user.server";
import { loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";
import { roles } from "prisma/initialization/data/production-data-generators";

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);
  const usersWithRoles = await getUsersWithSpecialRoles();
  return { usersWithRoles, availableRoles: roles };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await assertAuthorization(request);
  
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const username = formData.get("username") as string;
  const role = formData.get("role") as string;

  // Validate input
  if (!username || !role) {
    return json({ error: "Username and role are required" }, { status: 400 });
  }

  if (!roles.includes(role as any)) {
    return json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    if (action === "add") {
      await addRoleToUser(username, role);
      return json({ success: `Role ${role} added to user ${username}` });
    } else if (action === "remove") {
      await removeRoleFromUser(username, role);
      return json({ success: `Role ${role} removed from user ${username}` });
    } else {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger("admin-user-roles").error("Error managing user roles", { error, username, role, action });
    return json({ error: "Failed to update user roles" }, { status: 500 });
  }
};

export default function UserRolesManagement() {
  const { t } = useTranslation("admin");
  const { usersWithRoles, availableRoles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">{t("user-roles.title")}</h1>
      
      {actionData && "error" in actionData && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {actionData.error}
        </div>
      )}
      
      {actionData && "success" in actionData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {actionData.success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Role Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t("user-roles.add-role")}</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="add" />
            
            <div>
              <label htmlFor="add-username" className="block text-sm font-medium text-gray-700 mb-1">
                {t("user-roles.username")}
              </label>
              <input
                type="text"
                id="add-username"
                name="username"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("user-roles.username-placeholder")}
              />
            </div>
            
            <div>
              <label htmlFor="add-role" className="block text-sm font-medium text-gray-700 mb-1">
                {t("user-roles.role")}
              </label>
              <select
                id="add-role"
                name="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("user-roles.select-role")}</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : t("user-roles.add-button")}
            </button>
          </Form>
        </div>

        {/* Remove Role Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t("user-roles.remove-role")}</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="remove" />
            
            <div>
              <label htmlFor="remove-username" className="block text-sm font-medium text-gray-700 mb-1">
                {t("user-roles.username")}
              </label>
              <input
                type="text"
                id="remove-username"
                name="username"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("user-roles.username-placeholder")}
              />
            </div>
            
            <div>
              <label htmlFor="remove-role" className="block text-sm font-medium text-gray-700 mb-1">
                {t("user-roles.role")}
              </label>
              <select
                id="remove-role"
                name="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("user-roles.select-role")}</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Removing..." : t("user-roles.remove-button")}
            </button>
          </Form>
        </div>
      </div>

      {/* Users with Special Roles */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{t("user-roles.users-with-roles")}</h2>
        {usersWithRoles.length === 0 ? (
          <p className="text-gray-500">{t("user-roles.no-users")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("user-roles.username")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("user-roles.role")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersWithRoles.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span
                            key={role.title}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {role.title}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
