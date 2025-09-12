import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ParseKeys } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Attachment } from "prisma/generated";
import { isAttachmentType } from "prisma/initialization/data/fake-data-generators";
import { renderDate } from "~/components/date-rendering";
import { CommonMarkdown } from "~/components/markdown";
import { ModalDialog } from "~/components/modal";
import { conditionalShowGlobalButtons } from "~/components/page/page";
import { ProjectTagList } from "~/components/tags/tags";
import { getProjectDetails } from "~/database/repositories/projects.server";
import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";

import style from "./$projectId._index.module.css";
import { MetadataDisplay } from "./components/metadata-display";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  const isOwnerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
  const isMemberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
  const isProjectAdminLoggedIn = await loggedInUserHasRole(request, Roles.ProjectEditor);

  const isLoggedInUserAuthorizedToEdit =
    isOwnerLoggedIn || isMemberLoggedIn || isProjectAdminLoggedIn;
  const isLoggedInUserAuthorizedToDelete = isOwnerLoggedIn || isProjectAdminLoggedIn;

  return {
    project,
    ...conditionalShowGlobalButtons({
      editButton: isLoggedInUserAuthorizedToEdit,
      deleteButton: isLoggedInUserAuthorizedToDelete,
    }),
    isLoggedInUserAuthorizedToEdit,
  };
};

export default function Project() {
  const { t, i18n } = useTranslation("projects");
  const { project, isLoggedInUserAuthorizedToEdit } = useLoaderData<typeof loader>();

  const allUsers = [...project.owners, ...project.members];

  return (
    <>
      <header className={`${style.projectHeader} secondary padding`}>
        <div className="main-info">
          <h2>{project.title}</h2>
          <span className={`left ${style.memberList} tiny-margin`}>
            {t("by")}:
            <nav className={style.memberListNav}>
              {allUsers.map(({ username }) => (
                <UserChip key={username} username={username} />
              ))}
            </nav>
          </span>

          <span className={`left ${style.tagList} tiny-margin`}>
            {t("tags")}:
            <ProjectTagList className="no-margin" tags={project.tags} />
          </span>

          <div className="description">
            <CommonMarkdown>{project.description}</CommonMarkdown>
          </div>
        </div>

        <MetadataDisplay metadata={project.metadata} className={style.metadata} />
        {project.mainImage ? (
          <img
            className={`small-round ${style.mainImage}`}
            src={project.mainImage}
            alt={t("main-image")}
          />
        ) : null}
      </header>

      {project.attachments.length > 0 ? (
        <section className="tertiary padding no-margin">
          <AttachmentSummary attachments={project.attachments} textKey="attachments" />
        </section>
      ) : null}

      <ul className="list border margin">
        {project.steps.map((step) => (
          <li key={step.id} className={`${style.stepItem} small-padding`}>
            <h4 className={style.stepHeadline}>
              {t("project-step-headline", {
                date: renderDate(step.creationDate, i18n.language),
              })}
              {isLoggedInUserAuthorizedToEdit ? DeleteAndEditButton(step.id) : null}
            </h4>
            <CommonMarkdown>{step.description}</CommonMarkdown>

            {step.attachments.length > 0 ? (
              <AttachmentSummary attachments={step.attachments} textKey="step.attachments" />
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

function AttachmentSummary({
  attachments,
  textKey,
}: {
  attachments: Attachment[];
  textKey: ParseKeys<"projects">;
}) {
  const { t } = useTranslation("projects");

  return (
    <details className={style.stepAttachments}>
      <summary>
        <span className="chip">
          <i>attach_file</i>
          <div className="badge none">{attachments.length}</div>
          {t(textKey)}
        </span>
      </summary>
      <AttachmentRow attachments={attachments} />
    </details>
  );
}

function AttachmentRow({ attachments }: { attachments: Attachment[] }) {
  return (
    <ul className={`row scroll tertiary padding ${style.attachmentRow}`}>
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <AttachmentEntry {...attachment} />
        </li>
      ))}
    </ul>
  );
}

function DeleteAndEditButton(stepId: string) {
  const { t } = useTranslation("projects");

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={style.deleteEditContainer}>
      <ModalDialog
        visible={confirmDelete}
        closed={() => setConfirmDelete(false)}
        render={(close) => (
          <>
            {t("step.delete-confirm")}
            <footer>
              <form action={`/projects/step/${stepId}/delete`} method="post">
                <button type="submit" className={style.deleteButton}>
                  {t("yes", { ns: "common" })}
                </button>
                <button type="button" autoFocus onClick={close}>
                  {t("no", { ns: "common" })}
                </button>
              </form>
            </footer>
          </>
        )}
      />

      <button className="transparent square">
        <i>more_vert</i>
        <menu className="border no-wrap left vertical">
          <Link className="button small-margin small-round" to={`/projects/step/${stepId}/edit`}>
            <i>edit</i>
            <span className="m l">{t("step.edit")}</span>
          </Link>
          <Link
            className="button small-margin border small-round"
            to={`/projects/step/${stepId}/delete`}
            onClick={(event) => {
              setConfirmDelete(true);
              event.stopPropagation();
              event.preventDefault();
              return false;
            }}
          >
            <i>delete</i>
            <span className="m l">{t("step.delete")}</span>
          </Link>
        </menu>
      </button>
    </div>
  );
}

function AttachmentEntry(props: Attachment) {
  const { type, text, url } = props;

  if (!isAttachmentType(type)) {
    return <>Error: Unknown attachment type {{ type }}</>;
  }

  switch (type) {
    case "file":
      return (
        <a className="chip" href={url}>
          <i>file_save</i>
          {text}
        </a>
      );
    case "link":
      return (
        <a className="chip" href={url}>
          <i>link</i>
          {text}
        </a>
      );
    case "image":
      return <img className={`small-round ${style.attachmentImage}`} src={url} alt={text} />;
  }

  // This should be dead code, but just in case someone uses a nonstandard tsc...
  return <>Error: Unknown attachment type {{ type }}</>;
}

function UserChip({ username }: { username: string }) {
  return (
    <Link key={username} to={`/users/${username}`}>
      <button className="chip">
        <i>account_circle</i>
        <span>{username}</span>
      </button>
    </Link>
  );
}
