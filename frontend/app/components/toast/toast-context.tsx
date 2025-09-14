import { UIMatch, useMatches } from "@remix-run/react";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const ToastType = {
  DEFAULT: "",
  ERROR: "error",
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
} as const;
export type ToastType = (typeof ToastType)[keyof typeof ToastType];

export const ToastDuration = {
  SHORT: 1500,
  LONG: 4000,
} as const;
export type ToastDuration = (typeof ToastDuration)[keyof typeof ToastDuration];

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: ToastDuration;
  isActive?: boolean;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: ToastDuration;
}

interface ToastContextType {
  toasts: readonly Toast[];
  showToast: (message: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const animationDurationInMs = 500;

  const [toasts, setToasts] = useState<Toast[]>([]);

  const setToastActive = useCallback(
    (toastId: Toast["id"], isActive: boolean) => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === toastId ? { ...toast, isActive } : toast)),
      );
    },
    [setToasts],
  );

  const addToast = useCallback(
    (toast: Toast) => setToasts((prev) => [...prev, toast]),
    [setToasts],
  );

  const removeToast = useCallback(
    (toastId: Toast["id"]) => setToasts((prev) => prev.filter((toast) => toast.id !== toastId)),
    [setToasts],
  );

  const fadeOutToast = useCallback(
    (id: string) => {
      setToastActive(id, false);

      const timeout = setTimeout(() => removeToast(id), animationDurationInMs);
      return () => clearTimeout(timeout);
    },
    [removeToast, setToastActive],
  );

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = Math.random().toString(36).substring(2, 9);
      const { type = "", duration = ToastDuration.SHORT } = options;

      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        isActive: false,
      };

      addToast(newToast);

      const activationTimeout = setTimeout(() => setToastActive(id, true), 10);
      const fadeOutTimeout = setTimeout(() => fadeOutToast(id), duration);

      return () => {
        clearTimeout(activationTimeout);
        clearTimeout(fadeOutTimeout);
      };
    },
    [addToast, fadeOutToast, setToastActive],
  );

  const value: ToastContextType = {
    toasts,
    showToast,
    removeToast: fadeOutToast,
  };

  const toastsFromSession = getGlobalToastRequests(useMatches());
  useEffect(() => {
    for (const toast of toastsFromSession) {
      const { message, ...options } = toast;
      showToast(message, options);
    }
    // we need to stringify the toastsFromSession because it is an array and dependencies are not deep compared
    // take extra care when changing this effect to include new dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(toastsFromSession), showToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export const globalToastLoaderKey = "global-toast";
export interface GlobalToastRequest extends ToastOptions {
  message: string;
}
const isGlobalToastRequest = (data: unknown): data is GlobalToastRequest => {
  return (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string" &&
    (!("duration" in data) || typeof data.duration === "number") &&
    (!("type" in data) || typeof data.type === "string")
  );
};

function getGlobalToastRequests(routes: UIMatch[]): GlobalToastRequest[] {
  return routes.flatMap((route) => {
    if (
      typeof route.data === "object" &&
      route.data !== null &&
      globalToastLoaderKey in route.data &&
      Array.isArray(route.data[globalToastLoaderKey]) &&
      route.data[globalToastLoaderKey].length > 0 &&
      route.data[globalToastLoaderKey].every(isGlobalToastRequest)
    ) {
      return route.data[globalToastLoaderKey];
    }
    return [];
  });
}
