import type { User } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ImageSelect } from "~/components/form-input/image-select";
import { UserImage } from "~/components/users/user-image";
import { isThisUserLoggedIn } from "~/lib/authentication";
import { getSession } from "~/lib/session";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/handler-s3.server";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { getUserOverview, updateUser } from "~/models/user.server";

import { getTrimmedStringsDefaultEmpty } from "../projects+/lib/formDataParser";
import styles from "./$username.edit.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";
const USERNAME_TAKEN = "USERNAME_TAKEN";

type ActionResponse = { success: true; user: User } | { success: false; error: string };
export const action = async ({
  params,
  request,
}: ActionArgs): Promise<TypedResponse<ActionResponse>> => {
  invariant(params.username, `params.slug is required`);

  const user = await getUserOverview(params.username);
  invariant(user, `User not found: ${params.username}`);

  if (!(await isThisUserLoggedIn(request, user))) {
    return redirect("/");
  }

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["mainPhoto"]);

  const { username, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "username",
    "description"
  );
  if (username.length === 0) {
    return json({
      success: false,
      error: FIELD_EMPTY,
    });
  }

  try {
    const updatedUser = await updateUser({ id: user.id, username, description, image: user.image });
    const session = await getSession(request);
    session.set("user", updatedUser);
    const headers = await session.commit();

    if (user.username !== updatedUser.username) {
      return redirect(`/users/${updatedUser.username}/edit`, { headers });
    }

    return json({ success: true, user: updatedUser }, { headers });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        e.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        e.meta?.target.includes("username")
      ) {
        return json({
          success: false,
          error: USERNAME_TAKEN,
        });
      }
    }
    return json({
      success: false,
      error: UPDATE_FAILED,
    });
  }
};

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.username, `params.slug is required`);

  const user = await getUserOverview(params.username);
  invariant(user, `User not found: ${params.username}`);

  if (!(await isThisUserLoggedIn(request, user))) {
    return redirect("/");
  }

  return json({ user });
};

export const handle = {
  i18n: ["users"],
};

export default function UserEdit() {
  const { t } = useTranslation("users");
  const actionData = useActionData<typeof action>();
  const { user } = useLoaderData<typeof loader>();

  return (
    <main className={styles.main}>
      <Form action="." method="POST" encType="multipart/form-data">
        <UserImage {...user} t={t} className={styles.atRight} />
        <ImageSelect
          maxPhotoSize={MAX_UPLOAD_SIZE_IN_BYTE}
          multiple={false}
          t={useTranslation("projects").t}
          label={t("profile-picture")}
          name="image"
        ></ImageSelect>
        <label>
          {t("username")}
          <input type="text" name="username" defaultValue={user.username} />
        </label>
        {actionData?.success === false && actionData.error === "USERNAME_TAKEN"
          ? t("username-taken")
          : null}
        <label>
          {t("description")}
          <textarea name="description" defaultValue={user.description ?? ""}></textarea>
        </label>

        <button type="submit">{t("save")}</button>
      </Form>
    </main>
  );
}
