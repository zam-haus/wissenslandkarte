import { globalToastLoaderKey, ToastDuration, ToastType } from "~/components/toast/toast-context";

import { logger } from "./logging.server";
import { getSession, toastSessionKey } from "./session.server";

export async function flashToastInSession(
  request: Request,
  message: string,
  type: ToastType,
  duration?: ToastDuration,
) {
  logger("flash-toast").debug("flashing toast in session", { toast: { message, type, duration } });
  const session = await getSession(request);
  const existingToast = session.get(toastSessionKey);
  session.flash(toastSessionKey, [...(existingToast || []), { message, type, duration }]);
  return session.commit();
}

export async function loadToastsFromSession(request: Request) {
  const session = await getSession(request);
  const toasts = session.get(toastSessionKey);

  logger("flash-toast").debug("loaded toasts from session", { toasts });

  if (toasts !== undefined) {
    return { toastData: { [globalToastLoaderKey]: toasts }, headers: await session.commit() };
  }
  return null;
}
