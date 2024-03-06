import type { TFunction } from "i18next";
import type { ChangeEvent } from "react";
import { useState } from "react";

import style from "./image-select.module.css";

export function ImageSelect({
  label,
  name,
  maxPhotoSize,
  t,
}: {
  label: string;
  name: string;
  maxPhotoSize: number;
  t: TFunction<"projects", undefined>;
}) {
  const [mainPhotoTooLarge, setMainPhotoTooLarge] = useState(false);
  const resetSizeCheckWarning = () => setMainPhotoTooLarge(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const sizeCheck = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    if (input.files !== null && [...input.files].some((file) => file.size > maxPhotoSize)) {
      setMainPhotoTooLarge(true);
      input.value = "";
    }
  };

  const newPhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    sizeCheck(event);

    const input = event.target;
    if (input.files !== null) {
      setPhotoPreviews([...input.files].map((file) => URL.createObjectURL(file)));
    }
  };

  return (
    <>
      <label>
        {label}
        <input
          type="file"
          name={name}
          accept="image/*"
          onClick={resetSizeCheckWarning}
          onChange={newPhotoSelected}
        />
        {mainPhotoTooLarge ? t("main-photo-too-large") : ""}
      </label>
      {photoPreviews.map((data) => (
        <img key={data} src={data} alt={t("main-photo-preview")} className={style.imagePreview} />
      ))}
    </>
  );
}
