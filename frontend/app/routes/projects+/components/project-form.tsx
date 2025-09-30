import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { Tag } from "prisma/generated";
import { ImageSelect } from "~/components/form-input/image-select";
import { TagSelect } from "~/components/form-input/tag-select";
import type { User } from "~/components/form-input/user-select";
import { UserSelect } from "~/components/form-input/user-select";
import type { MetadataType, MetadataValue } from "~/database/repositories/projectMetadata.server";
import type { getProjectDetails } from "~/database/repositories/projects.server";

import style from "../new.module.css";

import { MetadataForm } from "./metadata-form";
import { OwnerSelect } from "./owner-select";

type ProjectFormProps = {
  action: string | undefined;
  tags: Tag[];
  users: User[];
  maxImageSize: number;
  mode: "create" | "edit";
  availableMetadataTypes: MetadataType[];
  currentMetadata: MetadataValue[];
  canEditOwner?: boolean;
  defaultOwner?: { id: string; username: string };
};

export type CreateProjectFormProps = ProjectFormProps & {
  mode: "create";
};

export type EditProjectFormProps = ProjectFormProps & {
  mode: "edit";
  currentState: EditableProject;
};

type EditableProject = Omit<NonNullable<Awaited<ReturnType<typeof getProjectDetails>>>, "steps">;

export function ProjectForm(props: CreateProjectFormProps | EditProjectFormProps) {
  const { action, maxImageSize, tags, users, availableMetadataTypes, currentMetadata } = props;
  const { t } = useTranslation("projects");

  const currentState: EditableProject | null = props.mode === "edit" ? props.currentState : null;

  return (
    <Form
      action={action}
      method="post"
      encType="multipart/form-data"
      className={style.verticalForm}
    >
      <fieldset>
        <legend>{t("project-create-edit.basic-information")}</legend>
        <div className="field label border small-margin">
          <input name="title" type="text" defaultValue={currentState?.title} required />
          <label>
            {t("project-name")} {t("required")}
          </label>
        </div>

        <div className="field textarea label border small-margin">
          <textarea name="description" required defaultValue={currentState?.description}></textarea>
          <label>
            {t("project-description")} {t("required")}
          </label>
        </div>
      </fieldset>

      {currentState === null || currentState.mainImage === null ? null : (
        <>
          {t("current-main-image")}
          <img className={style.mainImage} src={currentState.mainImage} alt={t("main-image")} />
          Remove main image: <input type="checkbox" name="removeMainImage" />{" "}
          {/*autoset and hide when image removal is done*/}
        </>
      )}

      <fieldset>
        <legend>{t("project-create-edit.additional-information")}</legend>
        <ImageSelect
          fileInputName="mainImage"
          label={`${t("select-main-image")} ${t("common", "optional")}`}
          maxImageSize={maxImageSize}
          allowDescription={false}
        />
        <span className="helper">{t("project-create-edit.main-image-helper")}</span>
        <div className="space"></div>

        {props.canEditOwner ? (
          <>
            <OwnerSelect
              initiallyAvailableUsers={[
                ...(currentState?.owners ?? []),
                ...(props.defaultOwner ? [props.defaultOwner] : []),
                ...users,
              ]}
              defaultValue={props.defaultOwner}
            />
            <span className="helper">{t("project-create-edit.owner-helper")}</span>
            <div className="space"></div>
          </>
        ) : null}

        <UserSelect
          initiallyAvailableUsers={[...(currentState?.members ?? []), ...users]}
          defaultValue={currentState?.members}
        />
        <span className="helper">{t("project-create-edit.select-user-helper")}</span>
        <div className="space"></div>

        <TagSelect
          initiallyAvailableTags={[
            ...(currentState?.tags.map(({ id, name }) => ({ id, name, priority: Infinity })) ?? []),
            ...tags,
          ]}
          defaultValue={currentState?.tags}
          allowAddingNew={true}
        />
        <span className="helper">{t("project-create-edit.select-tag-helper")}</span>
        <div className="space"></div>
      </fieldset>

      <fieldset className={style.metadataSection}>
        <legend>{t("metadata")}</legend>

        <div className="field border small-margin">
          <label className="checkbox">
            <input type="checkbox" name="needProjectSpace" /> <span>{t("select-need-space")} </span>
          </label>
        </div>

        <MetadataForm
          availableMetadataTypes={[...availableMetadataTypes]}
          currentMetadata={currentMetadata}
        />
      </fieldset>

      <button className="top-margin" type="submit">
        {t("save")}
      </button>
    </Form>
  );
}
