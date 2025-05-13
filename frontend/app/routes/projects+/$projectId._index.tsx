import type { Attachment } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { isAttachmentType } from "prisma/initialization/data/fake-data-generators";
import { renderDate } from "~/components/date-rendering";
import { CommonMarkdown } from "~/components/markdown";
import { ModalDialog } from "~/components/modal";
import { conditionalShowEditButton } from "~/components/page/page";
import { ProjectTagList } from "~/components/tags";
import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { getProjectDetails } from "~/models/projects.server";

import style from "./$projectId._index.module.css";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.projectId, `params.projectId is required`);

  const project = await getProjectDetails(params.projectId);
  invariant(project, `Project not found: ${params.projectId}`);

  const isOwnerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
  const isMemberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
  const isProjectAdminLoggedIn = await loggedInUserHasRole(request, Roles.ProjectEditor);

  const isLoggedInUserAuthorizedToEdit =
    isOwnerLoggedIn || isMemberLoggedIn || isProjectAdminLoggedIn;

  return {
    project,
    ...conditionalShowEditButton(isLoggedInUserAuthorizedToEdit),
    isLoggedInUserAuthorizedToEdit,
  };
};

export const handle = {
  i18n: ["projects"],
};

export default function Project() {
  const { t, i18n } = useTranslation("projects");
  const { project, isLoggedInUserAuthorizedToEdit } = useLoaderData<typeof loader>();

  const allUsers = [...project.owners, ...project.members];

  return (
    <main>
      <header>
        <h2>{project.title}</h2>
        {t("by")}:{" "}
        <ul className={style.memberList}>
          {allUsers.map(({ username }) => (
            <li key={username} className={style.member}>
              <Link to={`/users/${username}`}>{username}</Link>
            </li>
          ))}
        </ul>
        {project.mainImage ? (
          <img style={{ maxWidth: 500 }} src={project.mainImage} alt={t("main-image")} />
        ) : null}
      </header>

      <CommonMarkdown>{project.description}</CommonMarkdown>

      <ProjectTagList className="tags" tags={project.tags} />

      <ul className={style.attachments}>
        {project.attachments.map((attachment) => (
          <li key={attachment.id}>
            <AttachmentEntry {...attachment} />
          </li>
        ))}
      </ul>

      <ul className={style.stepList}>
        {project.steps.map((step) => (
          <li key={step.creationDate.valueOf()}>
            <article className={style.step}>
              <header>
                <h4>
                  {t("project-step-headline", {
                    date: renderDate(step.creationDate, i18n.language),
                  })}
                </h4>
                {isLoggedInUserAuthorizedToEdit ? DeleteAndEditButton(step.id) : null}
              </header>
              <CommonMarkdown>{step.description}</CommonMarkdown>

              <ul className={style.attachments}>
                {step.attachments.map((attachment) => (
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

function DeleteAndEditButton(stepId: string) {
  const { t } = useTranslation("projects");

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <ModalDialog
        visible={confirmDelete}
        closed={() => setConfirmDelete(false)}
        render={(close) => (
          <>
            {t("delete-step-confirm")}
            <footer>
              <form action={`/projects/step/${stepId}/delete`} method="post">
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
        href={`/projects/step/${stepId}/delete`}
        onClick={(event) => {
          setConfirmDelete(true);
          event.stopPropagation();
          event.preventDefault();
          return false;
        }}
      >
        {t("delete-step")}
      </a>
      | <Link to={`/projects/step/${stepId}/edit`}>{t("edit-step")}</Link>
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
