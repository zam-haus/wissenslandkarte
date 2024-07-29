import type { Attachment } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { isAttachmentType } from "prisma/fake-data-generators";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import {
  mapDeserializedDates,
  renderDate,
  withDeserializedDates,
} from "~/components/date-rendering";
import { ModalDialog } from "~/components/modal";
import { conditionalShowEditButton } from "~/components/page/page";
import { ProjectTagList } from "~/components/tags";
import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import { getProjectDetails } from "~/models/projects.server";

import style from "./$projectId._index.module.css";

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.projectId, `params.slug is required`);

  const project = await getProjectDetails(params.projectId);
  invariant(project, `Project not found: ${params.projectId}`);

  const ownerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
  const memberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);

  return json({
    project,
    ...conditionalShowEditButton(ownerLoggedIn || memberLoggedIn),
    ownerLoggedIn,
    memberLoggedIn,
  });
};

export const handle = {
  i18n: ["projects"],
};

export default function Project() {
  const { t, i18n } = useTranslation("projects");
  const { project, ownerLoggedIn, memberLoggedIn } = useLoaderData<typeof loader>();

  const allUsers = [...project.owners, ...project.members];

  const attachments = project.attachments.map((project) =>
    withDeserializedDates(project, "creationDate")
  );
  const updates = project.updates.map((update) => withDeserializedDates(update, "creationDate"));

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
        {project.mainPhoto ? (
          <img style={{ maxWidth: 500 }} src={project.mainPhoto} alt={t("main-photo")} />
        ) : null}
      </header>

      <p>{project.description}</p>

      <ProjectTagList className="tags" tags={project.tags} />

      <ul className={style.attachments}>
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <AttachmentEntry {...attachment} />
          </li>
        ))}
      </ul>

      <ul>
        {updates.map((update) => (
          <li key={update.creationDate.valueOf()}>
            <article>
              <header>
                <h4>
                  {t("project-update-headline", {
                    date: renderDate(update.creationDate, i18n.language),
                  })}
                </h4>
                {ownerLoggedIn || memberLoggedIn ? DeleteAndEditButton(update.id) : null}
              </header>
              {update.description}

              <ul className={style.attachments}>
                {update.attachments.map(mapDeserializedDates("creationDate")).map((attachment) => (
                  <li key={attachment.id}>
                    <AttachmentEntry {...attachment} />
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}

function DeleteAndEditButton(updateId: string) {
  const { t } = useTranslation("projects");

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <ModalDialog
        visible={confirmDelete}
        closed={() => setConfirmDelete(false)}
        render={(close) => (
          <>
            {t("delete-update-confirm")}
            <footer>
              <form action={`/projects/update/${updateId}/delete`} method="post">
                <button type="submit">{t("yes", { ns: "common" })}</button>
                <button type="button" autoFocus onClick={close}>
                  {t("no", { ns: "common" })}
                </button>
              </form>
            </footer>
          </>
        )}
      />
      <a
        href={`/projects/update/${updateId}/delete`}
        onClick={(event) => {
          setConfirmDelete(true);
          event.stopPropagation();
          event.preventDefault();
          return false;
        }}
      >
        {t("delete-update")}
      </a>
      | <Link to={`/projects/update/${updateId}/edit`}>{t("edit-update")}</Link>
    </>
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
