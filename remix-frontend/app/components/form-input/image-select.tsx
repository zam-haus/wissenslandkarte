import type { TFunction } from "i18next";
import type { ChangeEvent, RefObject } from "react";
import { useMemo, useRef, useState } from "react";
import { useHydrated } from "remix-utils";

import style from "./image-select.module.css";

export function ImageSelect({
  label,
  nameFileSystem,
  nameCamera,
  maxPhotoSize,
  t,
}: {
  label: string;
  nameFileSystem: string;
  nameCamera: string;
  maxPhotoSize: number;
  t: TFunction<"projects", undefined>;
}) {
  const [mainPhotoTooLarge, setMainPhotoTooLarge] = useState(false);
  const resetSizeCheckWarning = () => setMainPhotoTooLarge(false);

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const isHydrated = useHydrated();
  const hasCamera = useMemo(
    () => isHydrated && document.createElement("input").capture !== undefined,
    [isHydrated]
  );

  const fileSystemInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const sizeCheck = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    if (input.files !== null && [...input.files].some((file) => file.size > maxPhotoSize)) {
      setMainPhotoTooLarge(true);
      input.value = "";
    }
  };

  const newPhotoSelected = (
    event: ChangeEvent<HTMLInputElement>,
    refToReset: RefObject<HTMLInputElement>
  ) => {
    sizeCheck(event);

    const input = event.target;
    if (input.files !== null) {
      setPhotoPreviews([...input.files].map((file) => URL.createObjectURL(file)));
      if (refToReset.current !== null) {
        refToReset.current.value = "";
      }
    }
  };

  return (
    <>
      <label>
        {label} {hasCamera ? t("file-system-suffix") : ""}
        <input
          type="file"
          name={nameFileSystem}
          accept="image/*"
          onClick={resetSizeCheckWarning}
          onChange={(event) => newPhotoSelected(event, cameraInputRef)}
          ref={fileSystemInputRef}
        />
      </label>
      {hasCamera ? (
        <label>
          {label} {t("camera-suffix")}
          <input
            type="file"
            name={nameCamera}
            capture="environment"
            accept="image/*"
            onClick={resetSizeCheckWarning}
            onChange={(event) => newPhotoSelected(event, fileSystemInputRef)}
            ref={cameraInputRef}
          />
        </label>
      ) : null}
      {mainPhotoTooLarge ? t("main-photo-too-large") : ""}
      {photoPreviews.map((data) => (
        <img key={data} src={data} alt={t("main-photo-preview")} className={style.imagePreview} />
      ))}
    </>
  );
}
