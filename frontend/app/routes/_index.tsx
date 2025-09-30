import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, NavLink, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { TagCloud } from "react-tagcloud";

import { Page } from "~/components/page/page";
import { ProjectsList } from "~/components/project-list/projects-list";
import { getProjectList } from "~/database/repositories/projects.server";
import { getTagList } from "~/database/repositories/tags.server";
import { loaderLoginCheck, loggedInUserHasAdminRole } from "~/lib/authorization.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const projects = await getProjectList({
    byNewestModification: true,
    limit: 15,
  });

  const tags = await getTagList({
    count: "projects",
    filter: "",
  });

  const isAdmin = await loggedInUserHasAdminRole(request);

  return { projects, tags, ...(await loaderLoginCheck(request)), isAdmin };
};

export const handle = {
  i18n: ["landing-page", "users"],
};

export default function Index() {
  const { t } = useTranslation("landing-page");
  const { projects, tags, isLoggedIn, isAdmin } = useLoaderData<typeof loader>();

  const adminNavItems = (className?: string) =>
    isAdmin ? (
      <>
        <NavLink to="/admin/applicationInfo" className={className}>
          <i>info</i>
          Admin-Area
        </NavLink>
      </>
    ) : null;

  return (
    <Page
      isLoggedIn={isLoggedIn}
      fallbackTitle={t("main-headline")}
      additionalNavItems={adminNavItems}
    >
      <h2>{t("topics-headline")}</h2>
      <ProjectTagCloud tags={tags} />

      <h2>{t("newest-steps-headline")}</h2>
      <p>{t("browse-prompt")}</p>
      <ProjectsList projects={projects}></ProjectsList>
    </Page>
  );
}

declare module "react-tagcloud" {
  interface TagCloudProps {
    style?: React.CSSProperties;
  }
}

function ProjectTagCloud({ tags }: { tags: Awaited<ReturnType<typeof getTagList<"projects">>> }) {
  const tagsForCloud = tags.map((tag) => ({ value: tag.name, count: tag._count.projects }));

  return (
    <TagCloud
      style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}
      minSize={12}
      maxSize={30}
      disableRandomColor={true}
      randomSeed={42}
      tags={tagsForCloud}
      renderer={(tag: { value: string }, size: number) => (
        <Link
          className="chip small-padding"
          to={`/search/projects?tags=${tag.value}`}
          key={tag.value}
          style={{ cursor: "pointer", fontSize: `${size}px`, blockSize: "fit-content" }}
        >
          {tag.value}
        </Link>
      )}
    />
  );
}
