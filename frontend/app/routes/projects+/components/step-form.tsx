import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { Attachment, Project, ProjectStep } from "prisma/generated";
import { ImageSelect } from "~/components/form-input/image-select";
import type { ProjectListEntry } from "~/database/repositories/projects.server";

import style from "./step-form.module.css";

type StepFormProps = {
  action: string | undefined;
  maxImageSize: number;
  projectsWithDates: ProjectListEntry[];
  mode: "create" | "edit";
};

export type CreateStepFormProps = StepFormProps & {
  mode: "create";
};

export type EditStepFormProps = StepFormProps & {
  mode: "edit";
  currentState: EditableStepProps;
};
type EditableStepProps = Pick<ProjectStep, "description" | "id"> & {
  attachments: Pick<Attachment, "id" | "text" | "type" | "url">[];
  project: Pick<Project, "id"> | null;
};

export function StepForm(props: CreateStepFormProps | EditStepFormProps) {
  const { action, maxImageSize, projectsWithDates } = props;
  const { t } = useTranslation("projects");

  const currentState: EditableStepProps | null = props.mode === "edit" ? props.currentState : null;

  return (
    <Form
      method="post"
      action={action}
      encType="multipart/form-data"
      className={style.verticalForm}
    >
      <label>
        {t("project-name")}
        <select name="projectId" required defaultValue={currentState?.project?.id}>
          {projectsWithDates.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </label>

      {currentState?.attachments.map((attachment) => {
        if (attachment.type !== "image") {
          return null;
        }

        return (
          <label key={attachment.id}>
            {t("delete-image")}
            <input type="checkbox" name="attachmentsToRemove" value={attachment.id} />
            <img src={attachment.url} alt={attachment.text} className={style.imagePreview} />
          </label>
        );
      })}

      <ImageSelect
        name="imageAttachments"
        label={`${t("select-image")} ${t("common", "optional")}`}
        maxImageSize={maxImageSize}
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
