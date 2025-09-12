import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import style from "./link-input.module.css";

const generateRandomKey = () => Math.random().toString(36).substring(2, 15);

export function MultipleLinkInputs({
  addressName,
  descriptionName,
}: {
  addressName: string;
  descriptionName: string;
}) {
  const minLinkCount = 0;
  const [linkKeys, setLinkKeys] = useState<string[]>([]);

  const increaseLinkCount = () =>
    setLinkKeys((prevKeys: string[]) => [...prevKeys, generateRandomKey()]);

  const removeLink = (key: string) =>
    setLinkKeys((prevKeys: string[]) => {
      if (prevKeys.length <= minLinkCount) {
        return prevKeys;
      }
      return prevKeys.filter((k) => k !== key);
    });

  return (
    <>
      {linkKeys.map((key) => (
        <LinkInput
          key={key}
          onDelete={() => removeLink(key)}
          addressName={addressName}
          descriptionName={descriptionName}
        />
      ))}
      <button className="transparent no-padding no-margin" onClick={increaseLinkCount}>
        <i className="small">add</i>
      </button>
    </>
  );
}

export function LinkInput({
  addressName,
  descriptionName,
  onDelete,
}: {
  addressName: string;
  descriptionName: string;
  onDelete: () => void;
}) {
  const { t } = useTranslation("common");

  const addressRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const id = useMemo(generateRandomKey, []);

  return (
    <div className={`small-padding border ${style.linkInputContainer}`}>
      <div className="field border label">
        <input type="url" name={addressName} id={`${id}-address`} ref={addressRef} required />
        <label htmlFor={`${id}-address`}>{t("form-input.link-address")}</label>
      </div>

      <div className="field border label">
        <input type="text" name={descriptionName} id={`${id}-description`} ref={descriptionRef} />
        <label htmlFor={`${id}-description`}>{t("form-input.link-description")}</label>
      </div>

      <button className="transparent no-padding no-margin" onClick={onDelete}>
        <i className="small">delete</i>
      </button>
    </div>
  );
}
