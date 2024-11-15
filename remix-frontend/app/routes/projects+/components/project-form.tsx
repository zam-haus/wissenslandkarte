import type { Tag } from "@prisma/client";
import type { FetcherWithComponents } from "@remix-run/react";
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
  tagFetcher: FetcherWithComponents<{
    tags: Tag[];
  }>;
  users: User[];
  userFetcher: FetcherWithComponents<{
    users: User[];
  }>;
  maxPhotoSize: number;
  mode: "create" | "update";
};

export type CreateProjectFormProps = ProjectFormProps & {
  mode: "create";
};

export type EditProjectFormProps = ProjectFormProps & {
  mode: "update";
  currentState: EditableProject;
};

type EditableProject = Omit<NonNullable<Awaited<ReturnType<typeof getProjectDetails>>>, "updates">;

export function ProjectForm(props: CreateProjectFormProps | EditProjectFormProps) {
  const { action, maxPhotoSize, tags, tagFetcher, users, userFetcher } = props;
  const { t } = useTranslation("projects");

  const currentState: EditableProject | null = props.mode === "update" ? props.currentState : null;

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
        userFetcher={userFetcher}
        defaultValue={currentState?.members}
        t={t}
        fetchMoreUsers={(filter: string) =>
          userFetcher.load(
            `${new URL(location.href).pathname}?usersFilter=${filter}&ignoreTags=true`
          )
        }
      />

      <TagSelect
        initiallyAvailableTags={[
          ...(currentState?.tags.map(({ id, name }) => ({ id, name, priority: Infinity })) ?? []),
          ...tags,
        ]}
        tagFetcher={tagFetcher}
        defaultValue={currentState?.tags}
        t={t}
        fetchMoreTags={(filter: string) =>
          tagFetcher.load(
            `${new URL(location.href).pathname}?tagsFilter=${filter}&ignoreUsers=true`
          )
        }
      />

      <label>
        {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
      </label>

      <button type="submit">{t("save")}</button>
    </Form>
  );
}
