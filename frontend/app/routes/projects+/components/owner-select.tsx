import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { globalUserLoader } from "~/routes/global_loaders+/users";

import { MultiSelect } from "../../../components/form-input/multi-select/multi-select";
import { iconWrappedRemovableItem } from "../../../components/form-input/multi-select/removable-item";

export type SelectableUser = { id: string; username: string };

export function OwnerSelect({
  initiallyAvailableUsers,
  defaultValue,
}: {
  initiallyAvailableUsers: SelectableUser[];
  defaultValue?: SelectableUser;
}) {
  const { t } = useTranslation("projects");

  const [availableUsers, setAvailableUsers] = useState(initiallyAvailableUsers);
  const [chosenUser, setChosenUser] = useState<string | null>(defaultValue?.username ?? null);

  const userFetcher = useFetcher<typeof globalUserLoader>();
  const fetchMoreUsers = (filter: string) =>
    userFetcher.load(`/global_loaders/users?userFilter=${filter}`);

  useEffect(() => {
    setAvailableUsers((available) => [...available, ...(userFetcher.data?.users ?? [])]);
  }, [userFetcher.data]);

  useEffect(() => {
    setAvailableUsers((available) =>
      [...available, ...(userFetcher.data?.users ?? [])].sort((a, b) =>
        a.username.localeCompare(b.username),
      ),
    );
  }, [userFetcher.data]);

  const chosenValues = chosenUser ? [chosenUser] : [];

  return (
    <MultiSelect
      inputPlaceholder={t("project-create-edit.owner-label")}
      inputName="owner"
      minRequired={1}
      chosenValues={chosenValues}
      valuesToSuggest={availableUsers
        .map(({ username }) => username)
        .filter((username) => !chosenValues.includes(username))}
      onFilterInput={fetchMoreUsers}
      onValueChosen={(newUser) => {
        setChosenUser(newUser);
      }}
      onValueRemoved={() => setChosenUser(null)}
      removableItemComponent={iconWrappedRemovableItem("account_circle")}
    />
  );
}
