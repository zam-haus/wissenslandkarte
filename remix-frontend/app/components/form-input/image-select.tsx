import type { TFunction } from "i18next";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useHydrated } from "remix-utils";

import style from "./image-select.module.css";

function useFileUploadHelpers({
  maxFileSize,
  clearInputWhenSizeExceeded,
}: {
  maxFileSize: number;
  clearInputWhenSizeExceeded?: boolean;
}) {
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const resetSizeCheckWarning = () => setFileTooLarge(false);

  const isHydrated = useHydrated();
  const hasCamera = useMemo(
    () => isHydrated && document.createElement("input").capture !== undefined,
    [isHydrated]
  );

  const checkFileSize = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const sizeExceeded =
      input.files !== null && [...input.files].some((file) => file.size > maxFileSize);

    setFileTooLarge(sizeExceeded);
    if (sizeExceeded && clearInputWhenSizeExceeded) {
      input.value = "";
    }

    return sizeExceeded;
  };

  const removeFileFromInput = useCallback((input: HTMLInputElement, index: number) => {
    const { files } = input;
    if (files === null) {
      return;
    }
    const newFilesList = new DataTransfer();

    for (let i = 0; i < files.length; i++) {
      if (i === index) {
        continue;
      }
      newFilesList.items.add(files[i]);
    }

    input.files = newFilesList.files;
  }, []);

  const addFilesToInput = useCallback((input: HTMLInputElement, newFiles: FileList) => {
    const newFilesList = new DataTransfer();

    if (input.files !== null) {
      for (let i = 0; i < input.files.length; i++) {
        newFilesList.items.add(input.files[i]);
      }
    }
    for (let i = 0; i < newFiles.length; i++) {
      const current = newFiles[i];
      newFilesList.items.add(
        new File([current], current.name, {
          type: current.type,
          lastModified: current.lastModified,
        })
      ); // TODO: prevent file being added twice
    }

    input.files = newFilesList.files;
  }, []);

  return {
    fileTooLarge,
    resetSizeCheckWarning,
    hasCamera,
    checkFileSize,
    removeFileFromInput,
    addFilesToInput,
  };
}

export function ImageSelect({
  label,
  name,
  maxPhotoSize,
  multiple,
  t,
}: {
  label: string;
  name: string;
  maxPhotoSize: number;
  multiple?: boolean;
  t: TFunction<"projects", undefined>;
}) {
  const { fileTooLarge, resetSizeCheckWarning, hasCamera, checkFileSize, addFilesToInput } =
    useFileUploadHelpers({
      maxFileSize: maxPhotoSize,
      clearInputWhenSizeExceeded: true,
    });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const actualFileUploadRef = useRef<HTMLInputElement>(null);

  const newPhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    checkFileSize(event);

    const selectInput = event.target;
    const uploadInput = actualFileUploadRef.current;
    if (selectInput.files === null || selectInput.files.length === 0 || uploadInput === null) {
      return;
    }

    if (!multiple) {
      uploadInput.value = "";
    }

    addFilesToInput(uploadInput, selectInput.files);
    const newFileUrls = Array.from(uploadInput.files ?? []).map(
      (file) => URL.createObjectURL(file) // TODO: This file needs to be released to avoid memleak
    );

    if (multiple) {
      setPhotoPreviews((photoPreviews) => [...photoPreviews, ...newFileUrls]);
    } else {
      setPhotoPreviews(newFileUrls);
    }

    selectInput.value = "";
  };

  return (
    <>
      <noscript>{t("noscript-warning")}</noscript>
      <input type="file" name={name} ref={actualFileUploadRef} />
      <label>
        {label} {hasCamera ? t("file-system-suffix") : ""}
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onClick={resetSizeCheckWarning}
          onChange={(event) => newPhotoSelected(event)}
        />
      </label>
      {hasCamera ? (
        <label>
          {label} {t("camera-suffix")}
          <input
            type="file"
            capture="environment"
            accept="image/*"
            onClick={resetSizeCheckWarning}
            onChange={(event) => newPhotoSelected(event)}
          />
        </label>
      ) : null}
      {fileTooLarge ? t("main-photo-too-large") : ""}
      {photoPreviews.map((url) => (
        <img key={url} src={url} alt={t("main-photo-preview")} className={style.imagePreview} />
      ))}
    </>
  );
}
