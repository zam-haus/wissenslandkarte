import { json, type LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { MultiSelect } from "~/components/multi-select/multi-select";
import { authenticator } from "~/lib/authentication.server";
import { getTagList } from "~/models/tags.server";
import { getUserList } from "~/models/user.server";

import style from "./projects.new.module.css";

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const [tags, users] = await Promise.all([getTagList(), getUserList()]);

  return json({ tags, users });
};

export const handle = {
  i18n: ["projects"],
};

export default function NewProject() {
  const { tags, users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const [chosenValues, setChosenValues] = useState<string[]>([]);
  const [chosenUsers, setChosenUsers] = useState<string[]>([]);

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
        <MultiSelect
          inputPlaceholder={t("typeahead-users")}
          inputLabel={t("select-other-users")}
          inputName="coworkers"
          chosenValues={chosenUsers}
          valuesToSuggest={Array.from(new Set(users.map(({ username }) => username)))}
          onValueChosen={(newUser) => {
            if (!chosenUsers.includes(newUser)) {
              setChosenUsers([...chosenUsers, newUser]);
            }
          }}
          onValueRemoved={(removedUser) =>
            setChosenUsers(chosenUsers.filter((user) => user != removedUser))
          }
        ></MultiSelect>
        <MultiSelect
          inputPlaceholder={t("typeahead-tags")}
          inputLabel={t("select-tags")}
          inputName="tags"
          chosenValues={chosenValues}
          valuesToSuggest={Array.from(
            new Set(tags.map(({ name }) => name))
          )} /*TODO: Move deduplication to component, load suggestions dynamically w/ paging*/
          allowAddingNew={true}
          onValueChosen={(newValue) => {
            if (!chosenValues.includes(newValue)) {
              setChosenValues([...chosenValues, newValue]);
            }
          }}
          onValueRemoved={(removedValue) =>
            setChosenValues(chosenValues.filter((value) => value != removedValue))
          }
        ></MultiSelect>
        <label>
          {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
        </label>
        <button type="submit">{t("save")}</button>
      </form>
    </main>
  );
}
