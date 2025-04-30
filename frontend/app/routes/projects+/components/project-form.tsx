import type { Tag } from "@prisma/client";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { ImageSelect } from "~/components/form-input/image-select";
import { TagSelect } from "~/components/form-input/tag-select";
import type { User } from "~/components/form-input/user-select";
import { UserSelect } from "~/components/form-input/user-select";
import type { getProjectDetails } from "~/models/projects.server";

import style from "../new.module.css";

type ProjectFormProps = {
  action: string | undefined;
  tags: Tag[];
  users: User[];
  maxPhotoSize: number;
  mode: "create" | "edit";
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
  const { action, maxPhotoSize, tags, users } = props;
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

      {currentState === null || currentState.mainPhoto === null ? null : (
        <>
          {t("current-main-photo")}
          <img className={style.mainPhoto} src={currentState.mainPhoto} alt={t("main-photo")} />
          Remove main photo: <input type="checkbox" name="removeMainPhoto" />{" "}
          {/*autoset and hide when image removal is done*/}
        </>
      )}

      <ImageSelect
        name="mainPhoto"
        t={t}
        label={`${t("select-main-photo")} ${t("optional")}`}
        maxPhotoSize={maxPhotoSize}
      />

      <UserSelect
        initiallyAvailableUsers={[...(currentState?.members ?? []), ...users]}
        defaultValue={currentState?.members}
        t={t}
      />

      <TagSelect
        initiallyAvailableTags={[
          ...(currentState?.tags.map(({ id, name }) => ({ id, name, priority: Infinity })) ?? []),
          ...tags,
        ]}
        defaultValue={currentState?.tags}
        allowAddingNew={true}
        t={t}
      />

      <label>
        {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
      </label>

      <button type="submit">{t("save")}</button>
    </Form>
  );
}
