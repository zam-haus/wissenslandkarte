import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { loader as globalTagLoader } from "~/routes/global_loaders+/tags";

import { MultiSelect } from "./multi-select/multi-select";

type Tag = {
  name: string;
  id: string;
  priority?: number;
};

export function TagSelect({
  initiallyAvailableTags,
  defaultValue,
  allowAddingNew,
}: {
  initiallyAvailableTags: Tag[];
  defaultValue?: Tag[];
  allowAddingNew: boolean;
}) {
  const { t } = useTranslation("common");

  const [availableTags, setAvailableTags] = useState(initiallyAvailableTags);
  const [chosenTags, setChosenTags] = useState<string[]>(
    defaultValue?.map(({ name }) => name) ?? [],
  );

  const tagFetcher = useFetcher<typeof globalTagLoader>();
  const fetchMoreTags = (filter: string) =>
    tagFetcher.load(`/global_loaders/tags?tagFilter=${filter}`);

  useEffect(() => {
    setAvailableTags((availableTags) =>
      [...availableTags, ...(tagFetcher.data?.tags ?? [])].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
      ),
    );
  }, [tagFetcher.data]);

  return (
    <>
      {tagFetcher.state == "loading" ? "Loading..." : ""}
      <MultiSelect
        inputPlaceholder={t("typeahead-tags")}
        inputName="tags"
        chosenValues={chosenTags}
        onFilterInput={fetchMoreTags}
        valuesToSuggest={availableTags
          .map(({ name }) => name)
          .filter((name) => !chosenTags.includes(name))}
        allowAddingNew={allowAddingNew}
        onValueChosen={(newValue) => {
          setChosenTags([...chosenTags, newValue]);
        }}
        onValueRemoved={(removedValue) =>
          setChosenTags(chosenTags.filter((value) => value != removedValue))
        }
      ></MultiSelect>
    </>
  );
}
