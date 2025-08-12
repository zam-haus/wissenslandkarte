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

type ProjectFormProps = {
  action: string | undefined;
  tags: Tag[];
  users: User[];
  maxImageSize: number;
  mode: "create" | "edit";
  availableMetadataTypes: MetadataType[];
  currentMetadata: MetadataValue[];
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
      <label>
        {t("project-name")} {t("required")}
        <input name="title" type="text" defaultValue={currentState?.title} required />
      </label>

      <label>
        {t("project-description")} {t("required")}
        <textarea name="description" required defaultValue={currentState?.description}></textarea>
      </label>

      {currentState === null || currentState.mainImage === null ? null : (
        <>
          {t("current-main-image")}
          <img className={style.mainImage} src={currentState.mainImage} alt={t("main-image")} />
          Remove main image: <input type="checkbox" name="removeMainImage" />{" "}
          {/*autoset and hide when image removal is done*/}
        </>
      )}

      <ImageSelect
        name="mainImage"
        label={`${t("select-main-image")} ${t("common", "optional")}`}
        maxImageSize={maxImageSize}
      />

      <UserSelect
        initiallyAvailableUsers={[...(currentState?.members ?? []), ...users]}
        defaultValue={currentState?.members}
      />

      <TagSelect
        initiallyAvailableTags={[
          ...(currentState?.tags.map(({ id, name }) => ({ id, name, priority: Infinity })) ?? []),
          ...tags,
        ]}
        defaultValue={currentState?.tags}
        allowAddingNew={true}
      />

      <label>
        {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
      </label>

      <MetadataForm
        availableMetadataTypes={[...availableMetadataTypes]}
        currentMetadata={currentMetadata}
      />

      <button type="submit">{t("save")}</button>
    </Form>
  );
}
