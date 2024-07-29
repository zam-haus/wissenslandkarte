import type { Attachment, Project, ProjectUpdate } from "@prisma/client";
import { Form } from "@remix-run/react";
import type { TFunction } from "i18next";

import { ImageSelect } from "~/components/form-input/image-select";
import type { ProjectListEntry } from "~/models/projects.server";

import style from "./update-form.module.css";

export type UpdateFormProps = {
  action: string;
  maxPhotoSize: number;
  t: TFunction<"projects">;
  projectsWithDates: ProjectListEntry[];
  mode: "create" | "update";
};

export type CreateUpdateFormProps = UpdateFormProps & {
  mode: "create";
};

export type EditUpdateFormProps = UpdateFormProps & {
  mode: "update";
  currentState: EditableUpdateProps;
};
type EditableUpdateProps = Pick<ProjectUpdate, "description" | "id"> & {
  attachments: Pick<Attachment, "id" | "text" | "type" | "url">[];
  Project: Pick<Project, "id"> | null;
};

export function UpdateForm(props: CreateUpdateFormProps | EditUpdateFormProps) {
  const { action, maxPhotoSize, t, projectsWithDates } = props;

  const currentState: EditableUpdateProps | null =
    props.mode === "update" ? props.currentState : null;

  return (
    <Form
      method="post"
      action={action}
      encType="multipart/form-data"
      className={style.verticalForm}
    >
      <label>
        {t("project-name")}
        <select name="projectId" required defaultValue={currentState?.Project?.id}>
          {projectsWithDates.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </label>

      <ImageSelect
        name="photoAttachments"
        t={t}
        label={`${t("select-photo")} ${t("optional")}`}
        maxPhotoSize={maxPhotoSize}
        multiple={true}
      />

      <label>
        {t("update-text")}
        <textarea name="description" required defaultValue={currentState?.description}></textarea>
      </label>

      <button type="submit">{t("save")}</button>
    </Form>
  );
}
