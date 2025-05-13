import { Temporal } from "@js-temporal/polyfill";
import type React from "react";
import { useTranslation } from "react-i18next";

export function renderDate(date: Date, language: string): string {
  return Temporal.Instant.from(date.toISOString()).toLocaleString(language);
}

export function LocalDate({ date }: { date: Date }): React.JSX.Element {
  const { i18n } = useTranslation("users");

  return <>{renderDate(date, i18n.language)} </>;
}
