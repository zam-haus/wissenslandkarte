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
};

export function UpdateForm(props: UpdateFormProps) {
  const { action, maxPhotoSize, t, projectsWithDates } = props;

  return (
    <Form
      method="post"
      action={action}
      encType="multipart/form-data"
      className={style.verticalForm}
    >
      <label>
        {t("project-name")}
        <select name="projectId" required>
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
        <textarea name="description" required></textarea>
      </label>

      <button type="submit">{t("save")}</button>
    </Form>
  );
}
