import { useTranslation } from "react-i18next";

export type RemovableItemProps = {
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

type RemovableItemWithIconProps = RemovableItemProps & { icon: string };
function RemovableItemWithIcon({ icon, value, onRemove }: RemovableItemWithIconProps) {
  const { t } = useTranslation("common");

  return (
    <div className="chip fill medium" onClick={onRemove}>
      <i>{icon}</i>
      {value}
      <i title={t("remove-item")}>close</i>
    </div>
  );
}

export function iconWrappedRemovableItem(icon: string): RemovableItemComponent {
  const Component = ({ value, onRemove }: RemovableItemProps) => (
    <RemovableItemWithIcon icon={icon} value={value} onRemove={onRemove} />
  );
  Component.displayName = `WrappedRemovableItemWithIcon(${icon})`;
  return Component;
}

export type RemovableItemComponent = typeof RemovableItem;
