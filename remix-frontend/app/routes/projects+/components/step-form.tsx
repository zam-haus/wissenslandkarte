import type { Attachment, Project, ProjectStep } from "@prisma/client";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { ImageSelect } from "~/components/form-input/image-select";
import type { ProjectListEntry } from "~/models/projects.server";

import style from "./step-form.module.css";

type StepFormProps = {
  action: string | undefined;
  maxPhotoSize: number;
  projectsWithDates: ProjectListEntry[];
  mode: "create" | "step";
};

export type CreateStepFormProps = StepFormProps & {
  mode: "create";
};

export type EditStepFormProps = StepFormProps & {
  mode: "step";
  currentState: EditableStepProps;
};
type EditableStepProps = Pick<ProjectStep, "description" | "id"> & {
  attachments: Pick<Attachment, "id" | "text" | "type" | "url">[];
  Project: Pick<Project, "id"> | null;
};

export function StepForm(props: CreateStepFormProps | EditStepFormProps) {
  const { action, maxPhotoSize, projectsWithDates } = props;
  const { t } = useTranslation("projects");

  const currentState: EditableStepProps | null = props.mode === "step" ? props.currentState : null;

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
        {t("step-text")}
        <textarea name="description" required defaultValue={currentState?.description}></textarea>
      </label>

      <button type="submit">{t("save")}</button>
    </Form>
  );
}
