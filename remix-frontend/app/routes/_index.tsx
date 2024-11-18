import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { mapDeserializedDates } from "~/components/date-rendering";
import { Page } from "~/components/page/page";
import { ProjectsList } from "~/components/projects/projects-list";
import { loaderLoginCheck } from "~/lib/authentication";
import { getProjectList } from "~/models/projects.server";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async ({ request }: DataFunctionArgs) => {
  const projects = await getProjectList({
    byNewestModification: true,
    limit: 5,
  });

  return json({ projects, ...(await loaderLoginCheck(request)) });
};

export const handle = {
  i18n: ["landing-page"],
};

export default function Index() {
  const { t } = useTranslation("landing-page");
  const { projects, isLoggedIn } = useLoaderData<typeof loader>();

  return (
    <Page isLoggedIn={isLoggedIn} title={t("main-headline")}>
      <main>
        <p>{t("browse-prompt")}</p>

        <Link to="search/projects">{t("search-button")}</Link>

        <h2>{t("newest-steps-headline")}</h2>
        <ProjectsList
          projects={projects.map(mapDeserializedDates("latestModificationDate"))}
        ></ProjectsList>
      </main>
    </Page>
  );
}
