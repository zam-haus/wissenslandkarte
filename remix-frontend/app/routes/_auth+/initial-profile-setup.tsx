import type { ActionArgs, TypedResponse } from "@remix-run/node";
import { json, type LoaderArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { Page } from "~/components/page/page";
import { prisma } from "~/db.server";
import { getSession, tempUserSessionKey, userSessionKey } from "~/lib/session";

export const action = async ({ request }: ActionArgs): Promise<TypedResponse<never | {}>> => {
  const session = await getSession(request);
  if (!session.has(tempUserSessionKey)) {
    return redirect("/");
  }
  const user = session.get(tempUserSessionKey);
  invariant(user, "user should have been in session, but was not");

  const username = (await request.formData()).get("username");
  invariant(username, "username must be provided");

  const newUser = await prisma.user.create({
    data: { ...user, id: undefined, setupCompleted: true },
  });

  session.unset(tempUserSessionKey);
  session.set(userSessionKey, newUser); // TODO: When the auth library has been updated, this should be in a "setLoggedInUser" function

  const headers = await session.commit();

  return redirect(`/users/${newUser.username}/edit`, { headers });

  //TODO: handle username taken (see username.edit)
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
  i18n: ["login"],
};

export default function SetupProfile() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation("login");

  return (
    <Page title="Setup Profile" isLoggedIn={true}>
      <h2>{t("welcome", { firstname: user.firstName })}</h2>

      <Form method="POST">
        <label>
          {t("username-prompt")}
          <input type="text" name="username" defaultValue={user.username} />
        </label>
        {t("next-step")}
        <button type="submit">{t("create")}</button>
      </Form>
    </Page>
  );
}
