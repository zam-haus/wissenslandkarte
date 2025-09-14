import type { ChangeEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHydrated } from "remix-utils/use-hydrated";

import style from "./image-select.module.css";

function useFileUploadHelpers({
  maxFileSize,
  clearInputWhenSizeExceeded,
}: {
  maxFileSize: number;
  clearInputWhenSizeExceeded?: boolean;
}) {
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [actualInputDisabled, setActualInputDisabled] = useState(true);
  const resetSizeCheckWarning = () => setFileTooLarge(false);

  const isHydrated = useHydrated();
  const hasCamera = useMemo(
    // capture attribute is undefined if no camera available
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    () => isHydrated && document.createElement("input").capture !== undefined,
    [isHydrated],
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

    if (input.files.length === 0) {
      setActualInputDisabled(true);
    }
  }, []);

  const addFilesToInput = useCallback((input: HTMLInputElement, newFiles: FileList) => {
    const newFilesList = new DataTransfer();

    if (input.files !== null) {
      for (const file of input.files) {
        newFilesList.items.add(file);
      }
    }
    for (const current of newFiles) {
      newFilesList.items.add(
        new File([current], current.name, {
          type: current.type,
          lastModified: current.lastModified,
        }),
      ); // TODO: prevent file being added twice
    }

    input.files = newFilesList.files;
    setActualInputDisabled(false);
  }, []);
  return {
    fileTooLarge,
    actualInputDisabled,
    resetSizeCheckWarning,
    hasCamera,
    checkFileSize,
    removeFileFromInput,
    addFilesToInput,
  };
}

type ImageSelectProps = {
  label: string;
  fileInputName: string;
  maxImageSize: number;
  multiple?: boolean;
} & ({ allowDescription: false } | { allowDescription: true; descriptionInputName: string });

export function ImageSelect({
  label,
  fileInputName,
  maxImageSize,
  multiple,
  ...props
}: ImageSelectProps) {
  const {
    fileTooLarge,
    actualInputDisabled,
    resetSizeCheckWarning,
    hasCamera,
    checkFileSize,
    addFilesToInput,
    removeFileFromInput,
  } = useFileUploadHelpers({
    maxFileSize: maxImageSize,
    clearInputWhenSizeExceeded: true,
  });

  const { t } = useTranslation("common");

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [descriptionInputIds, setDescriptionInputIds] = useState<string[]>([]);

  const actualFileUploadRef = useRef<HTMLInputElement>(null);

  const addDescriptionInputId = () => {
    const randomKey = Math.random().toString(36).substring(2, 15);
    setDescriptionInputIds((prevIds) => [...prevIds, randomKey]);
  };

  const removeDescriptionInputId = (index: number) => {
    setDescriptionInputIds((prevIds) => prevIds.filter((_, i) => i !== index));
  };

  const rebuildImagePreviews = (sourceInput: HTMLInputElement) => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const newFileUrls = Array.from(sourceInput.files ?? []).map(
      (file) => URL.createObjectURL(file), // TODO: This file needs to be released to avoid memleak before navigating away
    );

    setImagePreviews(newFileUrls);
  };

  const newImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
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
    addDescriptionInputId();
    rebuildImagePreviews(uploadInput);

    selectInput.value = "";
  };

  const removeImageByIndex = (index: number) => {
    const uploadInput = actualFileUploadRef.current;
    if (uploadInput === null) {
      return;
    }
    removeFileFromInput(uploadInput, index);
    removeDescriptionInputId(index);
    rebuildImagePreviews(uploadInput);
  };

  return (
    <>
      <noscript>{t("noscript-warning")}</noscript>
      <input
        className={style.actualFileInput}
        type="file"
        name={fileInputName}
        ref={actualFileUploadRef}
        disabled={actualInputDisabled}
      />
      <div className={style.imagePreviewsContainer}>
        {imagePreviews.map((url, index) => (
          <div key={url} className={`small-margin border small-padding ${style.imagePreview}`}>
            <button
              className={`transparent no-padding ${style.deleteImageButton}`}
              onClick={() => removeImageByIndex(index)}
            >
              <i className="fill primary-text">delete</i>
            </button>
            <img src={url} alt={t("image-preview")} className={style.imagePreview} />
            {props.allowDescription ? (
              <div className="field border label">
                <input
                  type="text"
                  name={props.descriptionInputName}
                  placeholder={t("form-input.image-description")}
                  aria-label={t("form-input.image-description")}
                  id={descriptionInputIds[index]}
                />
                <label htmlFor={descriptionInputIds[index]}>
                  {t("form-input.image-description")}
                </label>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className={style.buttonRow}>
        <button className="transparent">
          <i>add_photo_alternate</i>
          <span>
            {label} {hasCamera ? t("file-system-suffix") : ""}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onClick={resetSizeCheckWarning}
            onChange={(event) => newImageSelected(event)}
          />
        </button>
        {hasCamera ? (
          <button className="transparent">
            <i>add_a_photo</i>
            <span>
              {label} {t("camera-suffix")}
            </span>
            <input
              type="file"
              capture="environment"
              accept="image/*"
              onClick={resetSizeCheckWarning}
              onChange={(event) => newImageSelected(event)}
            />
          </button>
        ) : null}
      </div>
      {fileTooLarge ? t("image-too-large") : ""}
    </>
  );
}
