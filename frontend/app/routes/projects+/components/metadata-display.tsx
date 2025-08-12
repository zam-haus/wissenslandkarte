import { useTranslation } from "react-i18next";

import { type ProjectMetadata } from "~/database/repositories/projectMetadata.server";

import style from "./metadata-display.module.css";

type MetadataDisplayProps = {
  metadata: ProjectMetadata;
  language: string;
};

export function MetadataDisplay({ metadata, language }: MetadataDisplayProps) {
  const { t } = useTranslation("projects");

  if (metadata.length === 0) {
    return null;
  }

  return (
    <aside className={style.metadataSection}>
      <h3>{t("metadata")}</h3>
      <div className={style.metadataGrid}>
        {metadata.map((item) => {
          if (item.metadataType.translations.length === 0) {
            return null;
          }

          const translation =
            item.metadataType.translations.find((t) => t.language === language) ||
            item.metadataType.translations[0];

          return (
            <div key={item.id}>
              <div className={style.metadataLabel}>
                <span title={translation.description}>{translation.displayName}</span>
              </div>
              <div>
                <MetadataValue
                  value={item.value}
                  dataType={item.metadataType.dataType}
                  unit={translation.unit}
                />
              </div>
            </div>
          );
        })}
      </div>
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
