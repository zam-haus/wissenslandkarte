import { Form, useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { Attachment, ProjectStep } from "prisma/generated";
import { ImageSelect } from "~/components/form-input/image-select";
import { MultipleLinkInputs } from "~/components/form-input/link-input";
import type { ProjectListEntry } from "~/database/repositories/projects.server";

import style from "./step-form.module.css";

type StepFormProps = {
  action: string | undefined;
  maxImageSize: number;
  projectId: string;
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
};

export function StepForm(props: CreateStepFormProps | EditStepFormProps) {
  const { maxImageSize, projectsWithDates } = props;
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");

  const navigate = useNavigate();

  const currentState: EditableStepProps | null = props.mode === "edit" ? props.currentState : null;

  return (
    <Form method="post" encType="multipart/form-data" className={style.verticalForm}>
      <fieldset>
        <div className="field border label">
          <select
            id="newProjectId"
            name="newProjectId"
            required
            onChange={(e) => {
              if (props.mode === "create") navigate(`/projects/${e.target.value}/step/new`);
            }}
            defaultValue={props.projectId}
          >
            {projectsWithDates.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <label htmlFor="newProjectId">{t("project-name")}</label>
        </div>

        <div className="field border label textarea">
          <textarea
            name="description"
            required
            defaultValue={currentState?.description}
            id="description-input"
          ></textarea>
          <label htmlFor="description-input">{t("step-text")}</label>
        </div>
      </fieldset>

      {(currentState?.attachments.length ?? 0) > 0 ? (
        <fieldset>
          <legend>{t("steps-create-edit.existing-images")}</legend>
          {currentState?.attachments.map((attachment) => {
            if (attachment.type !== "image") {
              return null;
            }
            return (
              <div key={attachment.id} className={style.existingImage}>
                <label className="checkbox icon">
                  <input type="checkbox" name="attachmentsToRemove" value={attachment.id} />
                  <span>
                    <i className="fill">delete</i>
                    <i className="fill">cancel</i>
                  </span>
                </label>
                <img src={attachment.url} alt={attachment.text} className={style.imagePreview} />
              </div>
            );
          })}
        </fieldset>
      ) : null}

      {(currentState?.attachments.length ?? 0) > 0 ? (
        <fieldset>
          <legend>{t("steps-create-edit.link-attachments")}</legend>
          {currentState?.attachments.map((attachment) => {
            if (attachment.type !== "link") {
              return null;
            }
            return (
              <div key={attachment.id} className={`${style.existingLink} small-padding border`}>
                <label className="checkbox icon">
                  <input type="checkbox" name="attachmentsToRemove" value={attachment.id} />
                  <span>
                    <i className="fill">delete</i>
                    <i className="fill">cancel</i>
                  </span>
                </label>
                <div className={style.existingLinkFields}>
                  <input type="hidden" name="existingLinkIds" value={attachment.id} />
                  <div className="field border label">
                    <input
                      type="url"
                      name="existingLinkUrls"
                      defaultValue={attachment.url}
                      required
                    />
                    <label>{tCommon("form-input.link-address")}</label>
                  </div>
                  <div className="field border label">
                    <input
                      type="text"
                      name="existingLinkDescriptions"
                      defaultValue={attachment.text}
                    />
                    <label>{tCommon("form-input.link-description")}</label>
                  </div>
                </div>
              </div>
            );
          })}
        </fieldset>
      ) : null}

      <fieldset>
        <legend>{t("steps-create-edit.add-images")}</legend>
        <ImageSelect
          name="imageAttachments"
          label={`${t("select-image")} (${t("common", "optional")})`}
          maxImageSize={maxImageSize}
          multiple={true}
        />
      </fieldset>

      <fieldset>
        <legend>{t("steps-create-edit.link-attachments")}</legend>
        <MultipleLinkInputs
          addressName="linkAttachments"
          descriptionName="linkAttachmentsDescriptions"
        />
      </fieldset>

      <button className="margin-top" type="submit">
        {t("save")}
      </button>
    </Form>
  );
}
