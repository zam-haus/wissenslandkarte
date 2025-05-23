import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { globalUserLoader } from "~/routes/global_loaders+/users";

import { MultiSelect } from "./multi-select/multi-select";

export type User = { id: string; username: string };

export function UserSelect({
  initiallyAvailableUsers,
  defaultValue,
}: {
  initiallyAvailableUsers: User[];
  defaultValue?: User[];
}) {
  const { t } = useTranslation("common");

  const [availableUsers, setAvailableUsers] = useState(initiallyAvailableUsers);
  const [chosenUsers, setChosenUsers] = useState<string[]>(
    defaultValue?.map(({ username }) => username) ?? [],
  );

  const userFetcher = useFetcher<typeof globalUserLoader>();
  const fetchMoreUsers = (filter: string) =>
    userFetcher.load(`/global_loaders/users?userFilter=${filter}`);

  useEffect(() => {
    setAvailableUsers((availableUsers) => [...availableUsers, ...(userFetcher.data?.users ?? [])]);
  }, [userFetcher.data]);

  useEffect(() => {
    setAvailableUsers((availableUsers) =>
      [...availableUsers, ...(userFetcher.data?.users ?? [])].sort((a, b) =>
        a.username.localeCompare(b.username),
      ),
    );
  }, [userFetcher.data]);

  return (
    <>
      {userFetcher.state == "loading" ? "Loading..." : ""}
      <MultiSelect
        inputPlaceholder={t("typeahead-users")}
        inputLabel={`${t("select-other-users")} ${t("optional")}`}
        inputName="coworkers"
        chosenValues={chosenUsers}
        valuesToSuggest={availableUsers
          .map(({ username }) => username)
          .filter((username) => !chosenUsers.includes(username))}
        onFilterInput={fetchMoreUsers}
        onValueChosen={(newUser) => {
          setChosenUsers([...chosenUsers, newUser]);
        }}
        onValueRemoved={(removedUser) =>
          setChosenUsers(chosenUsers.filter((user) => user != removedUser))
        }
      ></MultiSelect>
    </>
  );
}
