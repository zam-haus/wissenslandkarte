import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { MetadataType, MetadataValue } from "~/database/repositories/projectMetadata.server";

type MetadataFormProps = {
  availableMetadataTypes: MetadataType[];
  currentMetadata: MetadataValue[];
};

export function MetadataForm({ availableMetadataTypes, currentMetadata }: MetadataFormProps) {
  const { i18n } = useTranslation("projects");
  const { language } = i18n;

  type MetadataState = {
    active: boolean;
    value: string;
  };

  const [metadataValues, setMetadataValues] = useState<Record<string, MetadataState>>(() => {
    const typesWithValue = new Set(currentMetadata.map((it) => it.metadataType.id));
    const valuesByType = Object.fromEntries(
      currentMetadata.map(({ metadataType, value }) => [metadataType.id, value]),
    );

    return Object.fromEntries(
      availableMetadataTypes.map(({ id }) => [
        id,
        { active: typesWithValue.has(id), value: valuesByType[id] || "" },
      ]),
    );
  });

  const handleActiveChange = (metadataTypeId: string) => {
    const currentState = metadataValues[metadataTypeId];

    setMetadataValues({
      ...metadataValues,
      [metadataTypeId]: { ...currentState, active: !currentState.active },
    });
  };

  const handleValueChange = (metadataTypeId: string, value: string) => {
    const currentState = metadataValues[metadataTypeId];

    setMetadataValues({ ...metadataValues, [metadataTypeId]: { ...currentState, value } });
  };

  if (availableMetadataTypes.length === 0) {
    return null;
  }

  return (
    <>
      {availableMetadataTypes.map((metadataType) => {
        const translation =
          metadataType.translations.find((t) => t.language === language) ||
          metadataType.translations[0];
        const { active, value } = metadataValues[metadataType.id];

        return (
          <div key={metadataType.id} className="border small-round tiny-padding">
            <label className="checkbox icon ">
              <input
                type="checkbox"
                checked={active}
                onChange={() => handleActiveChange(metadataType.id)}
              />
              <span>
                <i className="fill small-round">add</i>
                <i className="fill small-round">remove</i>
                <span title={translation.description}>
                  {translation.displayName}
                  <div className="tooltip right">{translation.description}</div>
                </span>
                {translation.unit ? (
                  <span className="tertiary-text"> ({translation.unit})</span>
                ) : null}
              </span>
            </label>
            {active ? (
              <div className="field border no-margin">
                <MetadataInput
                  metadataType={metadataType}
                  value={value}
                  onChange={(newValue) => handleValueChange(metadataType.id, newValue)}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

type MetadataInputProps = {
  metadataType: MetadataType;
  value: string;
  onChange: (value: string) => void;
};

function MetadataInput({ metadataType, value, onChange }: MetadataInputProps) {
  switch (metadataType.dataType) {
    case "int":
      return <IntegerInput metadataType={metadataType} value={value} onChange={onChange} />;
    case "float":
      return <FloatInput metadataType={metadataType} value={value} onChange={onChange} />;
    case "boolean":
      return <BooleanInput metadataType={metadataType} value={value} onChange={onChange} />;
    case "text":
    default:
      return <TextInput metadataType={metadataType} value={value} onChange={onChange} />;
  }
}

function IntegerInput({ metadataType, value, onChange }: MetadataInputProps) {
  const isValid = /^\d*$/.test(value) || value === "";

  return (
    <input
      type="number"
      name={`metadata[${metadataType.id}]`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={!isValid ? "invalid" : ""}
      step="1"
      min="0"
      required={true}
    />
  );
}

function FloatInput({ metadataType, value, onChange }: MetadataInputProps) {
  const isValid = /^\d*(\.\d*)?$/.test(value) || value === "";

  return (
    <input
      type="number"
      name={`metadata[${metadataType.id}]`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={!isValid ? "invalid" : ""}
      step="0.1"
      min="0"
      required={true}
    />
  );
}

function BooleanInput({ metadataType, value, onChange }: MetadataInputProps) {
  const { t } = useTranslation("projects");

  return (
    <select
      name={`metadata[${metadataType.id}]`}
      value={value}
      onChange={(e) => {
        if (e.target.value == "") {
          e.target.setCustomValidity(t("select-value"));
          return false;
        }
        e.target.setCustomValidity("");
        onChange(e.target.value);
      }}
      required={true}
    >
      <option value="">{t("select-value")}</option>
      <option value="true">{t("yes")}</option>
      <option value="false">{t("no")}</option>
    </select>
  );
}

function TextInput({ metadataType, value, onChange }: MetadataInputProps) {
  return (
    <textarea
      name={`metadata[${metadataType.id}]`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
    />
  );
}
