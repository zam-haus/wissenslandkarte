import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Handle } from "types/handle";
import { ToastDuration, ToastType, useToast } from "~/components/toast/toast-context";
import { UserImage } from "~/components/user/user-image";
import { getUserContactData } from "~/database/repositories/user.server";
import i18next from "~/i18next.server";
import { getLoggedInUser, isAnyUserLoggedIn } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { flashToastInSession } from "~/lib/flash-toast.server";
import { sendMail } from "~/lib/sendMail.server";

import { getBooleanDefaultFalse, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import styles from "./username.contact.module.css";

const ErrorKeys = {
  FIELD_EMPTY: "FIELD_EMPTY",
  SENDING_FAILED: "SENDING_FAILED",
  NO_RECEIVING_CONTACT_ADDRESS: "NO_RECEIVING_CONTACT_ADDRESS",
  NO_SENDING_CONTACT_ADDRESS: "NO_SENDING_CONTACT_ADDRESS",
} as const;
type ErrorMessage = (typeof ErrorKeys)[keyof typeof ErrorKeys];

type ActionResponse = { success: true } | { success: false; error: ErrorMessage };
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
      error: ErrorKeys.NO_RECEIVING_CONTACT_ADDRESS,
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
      error: ErrorKeys.FIELD_EMPTY,
    };
  }

  const { setReplyTo } = getBooleanDefaultFalse(formData, "setReplyTo");

  if (setReplyTo && sendingUser.contactEmailAddress === null) {
    return {
      success: false,
      error: ErrorKeys.NO_SENDING_CONTACT_ADDRESS,
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
      error: ErrorKeys.SENDING_FAILED,
    };
  }

  const t = await i18next.getFixedT(request, "users");
  const headers = await flashToastInSession(
    request,
    t("contact.confirmation"),
    ToastType.DEFAULT,
    ToastDuration.LONG,
  );
  return redirect(`/users/${receivingUser.username}`, { headers });
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

export const handle: Handle<"users"> = {
  pageTitleOverride: { ns: "users", key: "titles.contact-user" },
};

export default function UserEdit() {
  const { t } = useTranslation("users");
  const actionData = useActionData<typeof action>();
  const { isLoggedIn, receivingUserHasEmail, receivingUser } = useLoaderData<typeof loader>();

  const { showToast } = useToast();

  const getErrorMessage = useCallback(
    (error: ErrorMessage) => {
      switch (error) {
        case ErrorKeys.FIELD_EMPTY:
          return t("contact.field-empty");
        case ErrorKeys.NO_RECEIVING_CONTACT_ADDRESS:
          return t("contact.no-receiving-contact-address");
        case ErrorKeys.NO_SENDING_CONTACT_ADDRESS:
          return t("contact.no-sending-contact-address");
        case ErrorKeys.SENDING_FAILED:
          return t("contact.sending-failed");
      }
    },
    [t],
  );

  const error = actionData?.success === false ? actionData.error : null;
  useEffect(() => {
    if (error !== null) {
      showToast(getErrorMessage(error), { type: "error", duration: ToastDuration.LONG });
    }
  }, [error, showToast, getErrorMessage]);

  if (!isLoggedIn) {
    return (
      <div className="border padding margin error-border error-container">
        {t("contact.needs-login")}
      </div>
    );
  }
  if (!receivingUserHasEmail) {
    return (
      <div className="border padding margin error-border error-container">
        {t("contact.impossible-no-email")}
      </div>
    );
  }

  return (
    <>
      <header className={styles.userHeader}>
        {receivingUser.image ? <UserImage {...receivingUser} /> : null}
        <h2>{receivingUser.username}</h2>
      </header>
      <Form action="." method="POST" encType="multipart/form-data" className={styles.contactForm}>
        <div className="field textarea label border small-margin">
          <textarea required name="message"></textarea>
          <label>{t("contact.message")}</label>
        </div>
        <label className={`checkbox ${styles.includeMyEmail}`}>
          <input type="checkbox" name="setReplyTo" defaultChecked={true} />
          <span>{t("contact.include-my-email")}</span>
        </label>

        <span className={`helper ${styles.includeItYourselfHint}`}>{t("contact.email-hint")}</span>

        {actionData?.success === false ? (
          <ErrorMessage error={getErrorMessage(actionData.error)} />
        ) : null}

        {actionData?.success === true ? t("contact.confirmation") : null}

        <button type="submit"> {t("contact.send")} </button>
      </Form>
    </>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return <div className="border padding margin error-border error-container">{error}</div>;
}
