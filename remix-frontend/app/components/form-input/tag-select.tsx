import type { FetcherWithComponents } from "@remix-run/react";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";

import { MultiSelect } from "./multi-select/multi-select";

type Tag = {
  name: string;
  id: string;
  priority?: number;
};

export function TagSelect({
  initiallyAvailableTags,
  tagFetcher,
  defaultValue,
  t,
  fetchMoreTags,
}: {
  initiallyAvailableTags: Tag[];
  tagFetcher: FetcherWithComponents<{ tags: Tag[] }>;
  fetchMoreTags: (filter: string) => void;
  t: TFunction<"projects", undefined>;
  defaultValue?: Tag[];
}) {
  const [availableTags, setAvailableTags] = useState(initiallyAvailableTags);
  const [chosenTags, setChosenTags] = useState<string[]>(
    defaultValue?.map(({ name }) => name) ?? []
  );

  useEffect(() => {
    setAvailableTags((availableTags) =>
      [...availableTags, ...(tagFetcher.data?.tags ?? [])].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
      )
    );
  }, [tagFetcher.data]);

  return (
    <>
      {tagFetcher.state == "loading" ? "Loading..." : ""}
      <MultiSelect
        inputPlaceholder={t("typeahead-tags")}
        inputLabel={`${t("select-tags")} ${t("optional")}`}
        inputName="tags"
        chosenValues={chosenTags}
        onFilterInput={fetchMoreTags}
        valuesToSuggest={availableTags
          .map(({ name }) => name)
          .filter((name) => !chosenTags.includes(name))}
        allowAddingNew={true}
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
