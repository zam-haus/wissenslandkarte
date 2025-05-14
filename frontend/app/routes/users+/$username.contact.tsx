import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { UserImage } from "~/components/users/user-image";
import { getLoggedInUser, isAnyUserLoggedIn } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { sendMail } from "~/lib/sendMail.server";
import { getUserContactData } from "~/models/user.server";

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
    return <main className={styles.main}>To send messages you need to be logged in!</main>;
  }
  if (!receivingUserHasEmail) {
    return <main className={styles.main}>This user cannot be contacted via email.</main>;
  }

  return (
    <main className={styles.main}>
      <Form action="." method="POST" encType="multipart/form-data">
        <UserImage {...receivingUser} t={t} className={styles.atRight} />
        <label>
          Message:
          <textarea name="message"></textarea>
        </label>
        <label>
          Include my email address:
          <input type="checkbox" name="setReplyTo" /> (Otherwise, please put contact information in
          your message)
        </label>

        {actionData?.success === false && actionData.error === FIELD_EMPTY
          ? "No message sent: You must provide a message"
          : null}

        {actionData?.success === false && actionData.error === NO_RECEIVING_CONTACT_ADDRESS
          ? "No message sent: This user cannot be contacted via mail."
          : null}

        {actionData?.success === false && actionData.error === NO_SENDING_CONTACT_ADDRESS
          ? "No message sent: You wanted your contact address included but don't have one in your profile."
          : null}

        {actionData?.success === false && actionData.error === SENDING_FAILED
          ? "No message sent: An unknown error occurred."
          : null}

        {actionData?.success === true ? "Message sent." : null}

        <button type="submit"> Send </button>
      </Form>
    </main>
  );
}
