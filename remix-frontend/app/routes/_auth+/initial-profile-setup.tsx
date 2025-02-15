import { Prisma } from "@prisma/client";
import type { ActionArgs, TypedResponse } from "@remix-run/node";
import { json, type LoaderArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { Page } from "~/components/page/page";
import { prisma } from "~/db.server";
import { getStringsDefaultUndefined } from "~/lib/formDataParser";
import { getSession, tempUserSessionKey, userSessionKey } from "~/lib/session";

import style from "./initial-profile-setup.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";
const USERNAME_TAKEN = "USERNAME_TAKEN";

export const action = async ({
  request,
}: ActionArgs): Promise<TypedResponse<never | { success: false; error: string }>> => {
  const session = await getSession(request);
  if (!session.has(tempUserSessionKey)) {
    return redirect("/");
  }
  const user = session.get(tempUserSessionKey);
  invariant(user, "user should have been in session, but was not");

  const { username } = getStringsDefaultUndefined(await request.formData(), "username");
  if (username === undefined) {
    return json({
      success: false,
      error: FIELD_EMPTY,
    });
  }

  try {
    const newUser = await prisma.user.create({
      data: { ...user, username, id: undefined, setupCompleted: true },
    });

    session.unset(tempUserSessionKey);
    session.set(userSessionKey, newUser); // TODO: When the auth library has been updated, this should be in a "setLoggedInUser" function

    const headers = await session.commit();

    return redirect(`/users/${newUser.username}/edit`, { headers });
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

export const loader = async ({ request }: LoaderArgs) => {
  const session = await getSession(request);
  if (!session.has(tempUserSessionKey)) {
    return redirect("/");
  }
  const user = session.get(tempUserSessionKey);
  invariant(user, "user should have been in session, but was not");

  return json({ user });
};

export const handle = {
  i18n: ["login", "users"],
};

export default function SetupProfile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation("login");

  return (
    <Page title="Setup Profile" isLoggedIn={true}>
      <h2>{t("welcome", { firstname: user.firstName })}</h2>

      <Form method="POST" className={style.form}>
        <label>
          {t("username-prompt")}
          <input type="text" required name="username" defaultValue={user.username} />
        </label>

        {actionData?.success === false && actionData.error === USERNAME_TAKEN ? (
          <p>{t("username-taken", { ns: "users" })}</p>
        ) : null}
        {t("next-step")}
        <button type="submit">{t("create")}</button>
      </Form>
    </Page>
  );
}
