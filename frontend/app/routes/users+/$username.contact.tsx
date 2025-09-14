import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { UserImage } from "~/components/user/user-image";
import { getUserContactData } from "~/database/repositories/user.server";
import { getLoggedInUser, isAnyUserLoggedIn } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { sendMail } from "~/lib/sendMail.server";

import { getBooleanDefaultFalse, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import styles from "./$username.edit.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const SENDING_FAILED = "SENDING_FAILED";
const NO_RECEIVING_CONTACT_ADDRESS = "NO_RECEIVING_CONTACT_ADDRESS";
const NO_SENDING_CONTACT_ADDRESS = "NO_SENDING_CONTACT_ADDRESS";

type ActionResponse = { success: true } | { success: false; error: string };
export const action = async ({
  params,
  request,
}: ActionFunctionArgs): Promise<TypedResponse<never> | ActionResponse> => {
  assertExistsOr400(params.username, "username is required");

  const receivingUser = await getUserContactData(params.username);
  assertExistsOr404(receivingUser, `User not found: ${params.username}`);

  if (receivingUser.contactEmailAddress === null) {
    return {
      success: false,
      error: NO_RECEIVING_CONTACT_ADDRESS,
    };
  }

  const sendingUser = await getLoggedInUser(request);
  if (sendingUser === null) {
    return redirect("/");
  }

  const formData = await request.formData();
  const { message } = getTrimmedStringsDefaultEmpty(formData, "message");
  if (message.length === 0) {
    return {
      success: false,
      error: FIELD_EMPTY,
    };
  }

  const { setReplyTo } = getBooleanDefaultFalse(formData, "setReplyTo");

  if (setReplyTo && sendingUser.contactEmailAddress === null) {
    return {
      success: false,
      error: NO_SENDING_CONTACT_ADDRESS,
    };
  }

  const result = await sendMail(
    sendingUser.username,
    setReplyTo ? sendingUser.contactEmailAddress : null,
    receivingUser.username,
    receivingUser.contactEmailAddress,
    message,
  );
  if (!result) {
    return {
      success: false,
      error: SENDING_FAILED,
    };
  }

  return {
    success: true,
  };
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.username, "username is required");

  const receivingUser = await getUserContactData(params.username);
  assertExistsOr404(receivingUser, `User not found: ${params.username}`);

  return {
    isLoggedIn: await isAnyUserLoggedIn(request),
    receivingUserHasEmail: receivingUser.contactEmailAddress !== null,
    receivingUser: { ...receivingUser, contactEmailAddress: undefined },
  };
};

export default function UserEdit() {
  const { t } = useTranslation("users");
  const actionData = useActionData<typeof action>();
  const { isLoggedIn, receivingUserHasEmail, receivingUser } = useLoaderData<typeof loader>();

  if (!isLoggedIn) {
    return <main className={styles.main}>{t("contact-needs-login")}</main>;
  }
  if (!receivingUserHasEmail) {
    return <main className={styles.main}>{t("contact-impossible-no-email")}</main>;
  }

  return (
    <main className={styles.main}>
      <Form action="." method="POST" encType="multipart/form-data">
        <UserImage {...receivingUser} className={styles.atRight} />
        <label>
          {t("contact-message")}
          <textarea name="message"></textarea>
        </label>
        <label>
          {t("contact-include-my-email")}
          <input type="checkbox" name="setReplyTo" /> {t("contact-email-hint")}
        </label>

        {actionData?.success === false && actionData.error === FIELD_EMPTY
          ? t("contact-field-empty")
          : null}

        {actionData?.success === false && actionData.error === NO_RECEIVING_CONTACT_ADDRESS
          ? t("contact-no-receiving-contact-address")
          : null}

        {actionData?.success === false && actionData.error === NO_SENDING_CONTACT_ADDRESS
          ? t("contact-no-sending-contact-address")
          : null}

        {actionData?.success === false && actionData.error === SENDING_FAILED
          ? t("contact-sending-failed")
          : null}

        {actionData?.success === true ? t("contact-confirmation") : null}

        <button type="submit"> {t("contact-send")} </button>
      </Form>
    </main>
  );
}
