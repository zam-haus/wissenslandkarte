import type { Attachment } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { isAttachmentType } from "prisma/fake-data-generators";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { renderDate, withDeserializedDates } from "~/components/date-rendering";
import { conditionalShowEditButton } from "~/components/page/page";
import { ProjectTagList } from "~/components/tags";
import { isThisUserLoggedIn } from "~/lib/authentication";
import { getProjectDetails } from "~/models/projects.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.projectId, `params.slug is required`);

  const project = await getProjectDetails(params.projectId);
  invariant(project, `Project not found: ${params.projectId}`);

  const isTrue = (b: boolean) => b;
  const ownerLoggedIn = (
    await Promise.all(project.owners.map((user) => isThisUserLoggedIn(request, user)))
  ).some(isTrue);
  const memberLoggedIn = (
    await Promise.all(project.members.map((user) => isThisUserLoggedIn(request, user)))
  ).some(isTrue);

  return json({ project, ...conditionalShowEditButton(ownerLoggedIn || memberLoggedIn) });
};

export const handle = {
  i18n: ["projects"],
};

export default function Project() {
  const { t, i18n } = useTranslation("projects");
  const { project } = useLoaderData<typeof loader>();

  const allUsers = [...project.owners, ...project.members];

  const attachments = project.attachments.map((project) =>
    withDeserializedDates(project, "creationDate")
  );
  const updates = project.updates.map((project) => withDeserializedDates(project, "creationDate"));

  return (
    <main>
      <header>
        <h2>{project.title}</h2>
        {t("by")}:{" "}
        <ul>
          {allUsers.map(({ username }) => (
            <li key={username}>
              <Link to={`/users/${username}`}>{username}</Link>
            </li>
          ))}
        </ul>
        <img src={project.mainPhoto} alt={t("main-photo")} />
      </header>

      <p>{project.description}</p>

      <ProjectTagList className="tags" tags={project.tags} />

      <ul className="attachments">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <AttachmentEntry {...attachment} />
          </li>
        ))}
      </ul>

      <ul>
        {updates.map((update) => (
          <li key={update.creationDate.valueOf()}>
            <h4>
              {t("project-update-headline", {
                date: renderDate(update.creationDate, i18n.language),
              })}
            </h4>
            {update.description}
          </li>
        ))}
      </ul>
    </main>
  );
}

function AttachmentEntry(props: Attachment) {
  const { type, text, url } = props;

  if (!isAttachmentType(type)) {
    return <>Error: Unknown attachment type {{ type }}</>;
  }

  switch (type) {
    case "file": //fallthrough
    case "link":
      return <a href={url}>{text}</a>;
    case "image":
      return <img src={url} alt={text} />;
  }

  // This should be dead code, but just in case someone uses a nonstandard tsc...
  return <>Error: Unknown attachment type {{ type }}</>;
}
