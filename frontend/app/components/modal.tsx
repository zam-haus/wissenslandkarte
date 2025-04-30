import type { TFunction } from "i18next";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type DialogRenderFunction = (close: () => void, tCommon: TFunction<"common">) => React.JSX.Element;

/**
 * This modal dialog does not render its HTMLDialogElement until its first visible.
 * After first rendering it, it keeps it in the tree. This reduces the HTML to transfer
 * from the server after server side rendering. After that it behaves like a div that is
 * rendered and hidden or displayed using CSS display property.
 */
export function ModalDialog({
  visible,
  closed,
  render,
}: {
  visible: boolean;
  closed: () => void;
  render: DialogRenderFunction;
}) {
  const [renderedAtLeastOnce, setRenderedAtLeastOnce] = useState(visible);
  const ref = useRef<HTMLDialogElement | null>(null);
  const { t } = useTranslation("common");

  if (visible && !renderedAtLeastOnce) {
    setRenderedAtLeastOnce(true);
  }

  if (!visible && !renderedAtLeastOnce) {
    return <></>;
  }

  if (visible) {
    setTimeout(() => ref.current?.showModal(), 0);
  }

  const close = () => {
    ref.current?.close();
    closed();
  };

  return (
    <dialog
      ref={ref}
      onMouseDown={(event) => {
        if (event.target === ref.current) {
          close();
        }
      }}
    >
      {render(close, t)}
    </dialog>
  );
}
