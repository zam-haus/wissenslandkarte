import { ToastComponent } from "./toast";
import { useToast } from "./toast-context";

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </>
  );
}
