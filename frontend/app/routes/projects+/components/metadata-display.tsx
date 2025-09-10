import { useTranslation } from "react-i18next";

import { type MetadataValue } from "~/database/repositories/projectMetadata.server";

import style from "./metadata-display.module.css";

type MetadataDisplayProps = {
  metadata: MetadataValue[];
  className?: string;
};

export function MetadataDisplay({ metadata, className }: MetadataDisplayProps) {
  const { t, i18n } = useTranslation("projects");
  const { language } = i18n;

  if (metadata.length === 0) {
    return null;
  }

  return (
    <aside className={`tertiary padding small-round no-margin margin-bottom ${className}`}>
      <h3 className="small" style={{ fontSize: "1.2rem" }}>
        {t("metadata")}
      </h3>
      <ul className="list border">
        {metadata.map((item) => {
          if (item.metadataType.translations.length === 0) {
            return null;
          }

          const translation =
            item.metadataType.translations.find((t) => t.language === language) ||
            item.metadataType.translations[0];

          return (
            <li key={item.id}>
              {/* TODO: add an icon */}
              <div className={style.metadataLabel}>
                <h4 className="small" style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {translation.displayName}
                  <div className="tooltip">{translation.description}</div>
                </h4>
              </div>
              <div>
                <MetadataValue
                  value={item.value}
                  dataType={item.metadataType.dataType}
                  unit={translation.unit}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

type MetadataValueProps = {
  value: string;
  dataType: string;
  unit?: string | null;
};

function MetadataValue({ value, dataType, unit }: MetadataValueProps) {
  const { t } = useTranslation("projects");

  function formatValue(value: string, dataType: string): string {
    switch (dataType) {
      case "int":
        return parseInt(value, 10).toString();
      case "float":
        return parseFloat(value).toString();
      case "boolean":
        return value === "true" ? t("yes") : t("no");
      case "text":
      default:
        return value;
    }
  }

  return (
    <>
      {formatValue(value, dataType)}
      {unit ? <span> {unit}</span> : null}
    </>
  );
}
