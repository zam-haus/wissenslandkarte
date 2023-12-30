import { useTranslation } from "react-i18next";

import { Temporal } from "@js-temporal/polyfill";

export const mapDeserializedDates =
  <T, P extends keyof T>(properties: P | P[]) =>
  (object: T) =>
    withDeserializedDates(object, properties);

export function withDeserializedDates<T, P extends keyof T>(
  object: T,
  properties: P | P[]
): T & { [key in P]: Date } {
  const propertiesArray = Array.isArray(properties) ? properties : [properties];

  let rehydrated = object as T & { [key in P]: Date };
  for (const prop of propertiesArray) {
    const valueAsString = object[prop];
    if (typeof valueAsString !== "string") {
      throw Error(`Cannot parse ${prop.toString()} as date`);
    }
    rehydrated = { ...rehydrated, [prop]: new Date(valueAsString) };
  }

  return rehydrated;
}

export function renderDate(date: string | Date, language: string): string {
  const dateAsString = typeof date === "string" ? date : date.toISOString();
  return Temporal.Instant.from(dateAsString).toLocaleString(language);
}

export function LocalDate({ date }: { date: string | Date }): JSX.Element {
  const { i18n } = useTranslation("users");

  return <>{renderDate(date, i18n.language)} </>;
}
