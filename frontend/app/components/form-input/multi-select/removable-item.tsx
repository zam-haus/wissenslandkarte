import { useTranslation } from "react-i18next";

type RemovableItemProps = {
  value: string;
  onRemove: () => void;
};
export function RemovableItem({ value, onRemove }: RemovableItemProps) {
  const { t } = useTranslation("common");

  return (
    <div className="chip fill medium" onClick={onRemove}>
      {value}
      <i title={t("remove-item")}>close</i>
    </div>
  );
}
