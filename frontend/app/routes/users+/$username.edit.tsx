import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { UNSAFE_DataWithResponseInit as DataWithResponseInit } from "@remix-run/router";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import type { User } from "prisma/generated";
import { Prisma } from "prisma/generated";
import { ImageSelect } from "~/components/form-input/image-select";
import { UserImage } from "~/components/user-image/user-image";
import { getUserOverview, updateUser, UserOverview } from "~/database/repositories/user.server";
import { isThisUserLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";
import { getSession } from "~/lib/session.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/storage/constants";
import { deleteS3FilesByPublicUrl } from "~/lib/storage/s3Deletion.server";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";

import {
  getStringsDefaultUndefined,
  getTrimmedStringsDefaultEmpty,
} from "../../lib/formDataParser";
import { storeProfileImageS3ObjectPurposes } from "../projects+/lib/storeS3ObjectPurpose.server";

import styles from "./$username.edit.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";
const USERNAME_TAKEN = "USERNAME_TAKEN";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request, userToEdit: UserOverview) => {
  const isCurrentUserLoggedIn = await isThisUserLoggedIn(request, userToEdit);
  const isUserAdminLoggedIn = await loggedInUserHasRole(request, Roles.UserEditor);

  if (!(isCurrentUserLoggedIn || isUserAdminLoggedIn)) {
    logger("username-edit").warn(
      `Someone tried editing user ${userToEdit.username} but was not authorized to do so`,
    );
    throw redirect("/");
  }
})!;

type ActionResponse = { success: true; user: User } | { success: false; error: string };
export const action = async ({
  params,
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<never> | ActionResponse | DataWithResponseInit<ActionResponse>
> => {
  assertExistsOr400(params.username, "username is required");

  const user = await getUserOverview(params.username);
  assertExistsOr404(user, `User not found: ${params.username}`);

  await assertAuthorization(request, user);

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["image"]);

  const { username, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "username",
    "description",
  );
  const { image } = getStringsDefaultUndefined(formData, "image");

  if (username.length === 0) {
    if (image !== undefined) {
      await deleteS3FilesByPublicUrl([image]);
    }
    return {
      success: false,
      error: FIELD_EMPTY,
    };
  }

  if (image !== undefined) {
    if (user.image !== null) {
      await deleteS3FilesByPublicUrl([user.image]);
    }
    storeProfileImageS3ObjectPurposes(image, user, logger("username-edit"));
  }

  try {
    const updatedUser = await updateUser({
      id: user.id,
      username,
      description,
      image: image ?? user.image,
    });
    const session = await getSession(request);
    session.set("user", updatedUser);
    const headers = await session.commit();

    if (user.username !== updatedUser.username) {
      return redirect(`/users/${updatedUser.username}/edit`, { headers });
    }

    return data({ success: true, user: updatedUser }, { headers });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        e.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        e.meta.target.includes("username")
      ) {
        return {
          success: false,
          error: USERNAME_TAKEN,
        };
      }
    }
    return {
      success: false,
      error: UPDATE_FAILED,
    };
  }
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.username, "username is required");

  const user = await getUserOverview(params.username);
  assertExistsOr404(user, `User not found: ${params.username}`);

  await assertAuthorization(request, user);

  return { user };
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
      {actionData?.success === true ? <div>{t("profile-updated")}</div> : null}
      <Form method="POST" encType="multipart/form-data">
        <UserImage {...user} className={styles.atRight} />
        <ImageSelect
          maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
          multiple={false}
          label={t("profile-picture")}
          name="image"
        ></ImageSelect>
        <label>
          {t("username")}
          <input type="text" required name="username" defaultValue={user.username} />
        </label>
        {actionData?.success === false && actionData.error === USERNAME_TAKEN
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
