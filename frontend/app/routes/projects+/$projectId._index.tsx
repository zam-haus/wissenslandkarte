import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
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
import { ParseKeys } from "i18next";

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
      <header className="left">
        <h2>{project.title}</h2>
        <p>
          {t("by")}:
          <nav className={style.memberList} style={{ display: "inline-flex", gap: 0 }}>
            {allUsers.map(({ username }) => (
              <UserChip key={username} username={username} />
            ))}
          </nav>
        </p>
        <p>
          {t("tags")}:
          <ProjectTagList className="" tags={project.tags} />
        </p>
      </header>
      {project.mainImage ? (
        <img
          className="small-round"
          style={{ maxWidth: 500 }}
          src={project.mainImage}
          alt={t("main-image")}
        />
      ) : null}
      <MetadataDisplay metadata={project.metadata} className="right" />

      <CommonMarkdown>{project.description}</CommonMarkdown>

      {project.attachments.length > 0 ? (
        <AttachmentSummary attachments={project.attachments} textKey="attachments" />
      ) : null}

      <ul className="list border">
        {project.steps.map((step) => (
          <li style={{ padding: "8px 0", textWrap: "wrap" }}>
            <div className="max">
              <h4 style={{ fontSize: "1.25rem" }}>
                {t("project-step-headline", {
                  date: renderDate(step.creationDate, i18n.language),
                })}
              </h4>
              <CommonMarkdown>{step.description}</CommonMarkdown>

              {step.attachments.length > 0 ? (
                <AttachmentSummary attachments={step.attachments} textKey="step.attachments" />
              ) : null}
            </div>
            {isLoggedInUserAuthorizedToEdit ? DeleteAndEditButton(step.id) : null}
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
    <details>
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
    <ul className="row scroll" style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
    <div
      style={{
        alignSelf: "flex-start",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <ModalDialog
        visible={confirmDelete}
        closed={() => setConfirmDelete(false)}
        render={(close) => (
          <>
            {t("step.delete-confirm")}
            <footer>
              <form action={`/projects/step/${stepId}/delete`} method="post">
                <button type="submit" style={{ backgroundColor: "red" }}>
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
      <Link className="button small-round" to={`/projects/step/${stepId}/edit`}>
        <i>edit</i>
        {t("step.edit")}
      </Link>
      <Link
        className="button border small-round"
        to={`/projects/step/${stepId}/delete`}
        onClick={(event) => {
          setConfirmDelete(true);
          event.stopPropagation();
          event.preventDefault();
          return false;
        }}
      >
        <i>delete</i>
        {t("step.delete")}
      </Link>
    </div>
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
      return (
        <a className="chip" href={url}>
          <i>link</i>
          {text}
        </a>
      );
    case "image":
      return <img style={{ maxWidth: "250px" }} src={url} alt={text} className="small-round" />;
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
