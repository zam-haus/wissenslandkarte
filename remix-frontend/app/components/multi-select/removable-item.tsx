import style from "./removable-item.module.css";

type RemovableItemProps = {
  value: string;
  onRemove: () => void;
};
export function RemovableItem({ value, onRemove }: RemovableItemProps) {
  return (
    <div className={style.selectedItem}>
      {value}
      <button title="Remove Item" className={style.xButton} onClick={onRemove}>
        x
      </button>
    </div>
  );
}
