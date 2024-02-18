import { json, type LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MultiSelect } from "~/components/multi-select/multi-select";
import { authenticator } from "~/lib/authentication.server";
import { getTagList } from "~/models/tags.server";
import { getUserListFiltered } from "~/models/user.server";

import style from "./projects.new.module.css";

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const params = new URL(request.url).searchParams;

  const usersFilter = params.get("usersFilter") ?? "";
  const tagsFilter = params.get("tagsFilter") ?? "";
  const ignoreUsers = Boolean(params.get("ignoreUsers") ?? false);
  const ignoreTags = Boolean(params.get("ignoreTags") ?? false);

  const [tags, users] = await Promise.all([
    ignoreTags ? Promise.resolve([]) : getTagList({ count: "projects", filter: tagsFilter }),
    ignoreUsers ? Promise.resolve([]) : getUserListFiltered(usersFilter),
  ]);

  return json({ tags, users });
};

export const handle = {
  i18n: ["projects"],
};

export default function NewProject() {
  const { tags, users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const [availableTags, setAvailableTags] = useState(tags);
  const [availableUsers, setAvailableUsers] = useState(users);

  const [chosenTags, setChosenTags] = useState<string[]>([]);
  const [chosenUsers, setChosenUsers] = useState<string[]>([]);

  const tagFetcher = useFetcher<typeof loader>();
  const userFetcher = useFetcher<typeof loader>();
  const loadMoreTags = (filter: string) =>
    tagFetcher.load(`/projects/new?tagsFilter=${filter}&ignoreUsers=true`);
  const loadMoreUsers = (filter: string) =>
    userFetcher.load(`/projects/new?usersFilter=${filter}&ignoreTags=true`);

  useEffect(() => {
    setAvailableTags(
      [...availableTags, ...(tagFetcher.data?.tags ?? [])].sort(
        (a, b) => (b._count.projects ?? 0) - (a._count.projects ?? 0)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- including availableTags would lead to loop
  }, [tagFetcher.data]);
  useEffect(() => {
    setAvailableUsers(
      [...availableUsers, ...(userFetcher.data?.users ?? [])].sort((a, b) =>
        a.username.localeCompare(b.username)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- including availableUsers would lead to loop
  }, [userFetcher.data]);

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
        {userFetcher.state == "loading" ? "Loading..." : ""}
        <MultiSelect
          inputPlaceholder={t("typeahead-users")}
          inputLabel={t("select-other-users")}
          inputName="coworkers"
          chosenValues={chosenUsers}
          valuesToSuggest={availableUsers.map(({ username }) => username)}
          onFilterInput={(filterInput) => loadMoreUsers(filterInput)}
          onValueChosen={(newUser) => {
            setChosenUsers([...chosenUsers, newUser]);
          }}
          onValueRemoved={(removedUser) =>
            setChosenUsers(chosenUsers.filter((user) => user != removedUser))
          }
        ></MultiSelect>
        {tagFetcher.state == "loading" ? "Loading..." : ""}
        <MultiSelect
          inputPlaceholder={t("typeahead-tags")}
          inputLabel={t("select-tags")}
          inputName="tags"
          chosenValues={chosenTags}
          onFilterInput={(filterInput) => loadMoreTags(filterInput)}
          valuesToSuggest={availableTags.map(({ name }) => name)}
          allowAddingNew={true}
          onValueChosen={(newValue) => {
            setChosenTags([...chosenTags, newValue]);
          }}
          onValueRemoved={(removedValue) =>
            setChosenTags(chosenTags.filter((value) => value != removedValue))
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
