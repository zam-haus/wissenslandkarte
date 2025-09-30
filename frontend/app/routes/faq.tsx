import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";

import { Page } from "~/components/page/page";
import { isLoggedInLoader } from "~/lib/authorization.server";

export const loader = isLoggedInLoader;

export const handle = {
  i18n: ["faq"],
};

export default function FaqPage() {
  const { t } = useTranslation("faq");
  const { isLoggedIn } = useLoaderData<typeof loader>();

  const items = t("items", { returnObjects: true }) as { question: string; answer: string }[];

  return (
    <Page isLoggedIn={isLoggedIn} fallbackTitle={t("title")}>
      <section>
        {items.map((item, index) => (
          <details key={index} open className="small-round surface-variant margin">
            <summary className="small-round primary-container padding">
              <h3 className="small">{item.question}</h3>
            </summary>
            <div className="padding">
              <Markdown>{item.answer}</Markdown>
            </div>
          </details>
        ))}
      </section>
    </Page>
  );
}
