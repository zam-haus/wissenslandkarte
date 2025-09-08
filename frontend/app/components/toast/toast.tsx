import { useToast, type Toast } from "./toast-context";

interface ToastComponentProps {
  toast: Toast;
}

export function ToastComponent({ toast }: ToastComponentProps) {
  const { toasts } = useToast();
  const { isActive, type, message } = toast;

  const index = toasts.findIndex((it) => it.id === toast.id);

  return (
    <div
      className={`snackbar ${type} ${isActive ? "active" : ""}`}
      style={{ marginBottom: `${index * 4}rem` }}
    >
      <span>{message}</span>
    </div>
  );
}
