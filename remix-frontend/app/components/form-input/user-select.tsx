import type { FetcherWithComponents } from "@remix-run/react";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";

import { MultiSelect } from "./multi-select/multi-select";

type User = { id: string; username: string };

export function UserSelect({
  initiallyAvailableUsers,
  userFetcher,
  t,
  fetchMoreUsers,
  defaultValue,
}: {
  initiallyAvailableUsers: User[];
  userFetcher: FetcherWithComponents<{ users: User[] }>;
  fetchMoreUsers: (filter: string) => void;
  t: TFunction<"projects", undefined>;
  defaultValue?: User[];
}) {
  const [availableUsers, setAvailableUsers] = useState(initiallyAvailableUsers);
  const [chosenUsers, setChosenUsers] = useState<string[]>(
    defaultValue?.map(({ username }) => username) ?? []
  );

  useEffect(() => {
    setAvailableUsers((availableUsers) =>
      [...availableUsers, ...(userFetcher.data?.users ?? [])].sort((a, b) =>
        a.username.localeCompare(b.username)
      )
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
        valuesToSuggest={availableUsers.map(({ username }) => username)}
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
