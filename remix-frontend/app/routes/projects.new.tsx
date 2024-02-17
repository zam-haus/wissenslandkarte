import { json, type LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticator } from "~/lib/authentication.server";
import { getTagList } from "~/models/tags.server";
import { getUserList } from "~/models/user.server";

import style from "./projects.new.module.css";

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const [tags, users] = await Promise.all([getTagList(), getUserList()]);

  return json({ tags, users });
};

export default function NewProject() {
  const { tags, users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  return (
    <main>
      <form method="/projects/new" className={style.verticalForm}>
        <label>
          {t("project-name")}
          <input name="projectName" type="text" />
        </label>
        <label>
          {t("project-description")}
          <textarea name="projectDescription"></textarea>
        </label>
        <label>
          {t("select-tags")}
          <select multiple name="tags">
            {tags.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("select-other-users")}
          <select multiple name="users">
            {users.map(({ id, username }) => (
              <option key={id} value={id}>
                {username}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
        </label>
        <button type="submit">{t("save")}</button>
      </form>
    </main>
  );
}
