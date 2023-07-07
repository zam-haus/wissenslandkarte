import { Temporal } from "@js-temporal/polyfill"
import { useTranslation } from "react-i18next"


export function renderDate(dateAsString: string, language: string): string {
  return Temporal.Instant.from(dateAsString).toLocaleString(language)
}

export function LocalDate({ date }: { date: string }): JSX.Element {
  const { i18n } = useTranslation("users")

  return <>{renderDate(date, i18n.language)} </>
}