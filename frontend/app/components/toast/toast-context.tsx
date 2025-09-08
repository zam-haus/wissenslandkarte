import { createContext, useContext, useCallback, useState, PropsWithChildren } from "react";

export type ToastType = "" | "error" | "primary" | "secondary" | "tertiary";
export const ToastDuration = {
  SHORT: 1500,
  LONG: 4000,
} as const;
type ToastDurationType = (typeof ToastDuration)[keyof typeof ToastDuration];

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: ToastDurationType;
  isActive?: boolean;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: ToastDurationType;
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

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
