import type {
  UseComboboxState,
  UseComboboxStateChange,
  UseComboboxStateChangeOptions,
} from "downshift";
import { useCombobox } from "downshift";
import type { KeyboardEvent } from "react";
import { Fragment, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

import style from "./multi-select.module.css";
import { RemovableItem } from "./removable-item";

type MultiSelectProps = {
  valuesToSuggest: string[];
  chosenValues: string[];
  inputPlaceholder: string;
  inputLabel: string;
  inputName: string;
  onValueChosen: (value: string) => void;
  onValueRemoved: (value: string) => void;
  onFilterInput?: (filterInput: string) => void;
  allowAddingNew?: boolean;
};
export function MultiSelect(props: MultiSelectProps) {
  function downshiftStateReducer(
    state: UseComboboxState<string>,
    actionAndChanges: UseComboboxStateChangeOptions<string>,
  ) {
    const { type, changes } = actionAndChanges;
    // this prevents the menu from being closed when the user selects an item with 'Enter' or mouse
    switch (type) {
      case useCombobox.stateChangeTypes.InputKeyDownEnter:
      case useCombobox.stateChangeTypes.ItemClick:
        return {
          ...changes,
          isOpen: true,
          highlightedIndex: state.highlightedIndex,
          inputValue: state.inputValue,
        };
      default:
        return changes;
    }
  }

  const inputElementRef = useRef<HTMLInputElement | null>(null);
  const focusInputElement = () => inputElementRef.current?.focus();

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Enter":
      case "Tab":
        if (inputElementRef.current !== null && props.allowAddingNew) {
          chosenCallbackIfItemIsNew(inputElementRef.current.value);
        }
        event.stopPropagation();
        event.preventDefault();
        return;
    }
  }

  function selectItemViaDropdown(change: UseComboboxStateChange<string>) {
    if (change.selectedItem) {
      chosenCallbackIfItemIsNew(change.selectedItem);
    }
  }

  function chosenCallbackIfItemIsNew(item: string) {
    if (!props.chosenValues.includes(item)) {
      props.onValueChosen(item);
    }
  }

  type StringFilter = (s: string) => boolean;
  const [itemFilter, setItemFilter] = useState<StringFilter>(() => () => true);

  function createFilterFromUserInput(change: UseComboboxStateChange<string>) {
    setItemFilter(
      () => (item: string) => item.toLowerCase().includes(change.inputValue?.toLowerCase() ?? ""),
    );
  }

  const filteredInput = [...new Set(props.valuesToSuggest)].filter(itemFilter);

  const debouncedOnFilterInput = useDebounceCallback(props.onFilterInput ?? (() => void 0), 200);
  const { getLabelProps, getInputProps, getItemProps, getMenuProps, isOpen } = useCombobox({
    items: filteredInput,
    stateReducer: downshiftStateReducer,
    onSelectedItemChange: selectItemViaDropdown,
    onInputValueChange: (change) => {
      createFilterFromUserInput(change);
      if (props.onFilterInput) {
        debouncedOnFilterInput(change.inputValue);
      }
    },
  });

  return (
    <div>
      <label {...getLabelProps()}>{props.inputLabel}</label>
      <div>
        <div className={style.chosenItemsWrapper} onClick={focusInputElement}>
          {props.chosenValues.map((item) => (
            <Fragment key={item}>
              <RemovableItem value={item} onRemove={() => props.onValueRemoved(item)} />
              <input type="hidden" name={props.inputName} value={item} />
            </Fragment>
          ))}

          <div>
            <input
              placeholder={props.inputPlaceholder}
              {...getInputProps({ ref: inputElementRef, onKeyDown: onInputKeyDown })}
            />
            <div style={{ position: "relative" }}>
              <ul
                className={`${style.menu} ${isOpen ? style.openMenu : style.closedMenu}`}
                {...getMenuProps()}
              >
                {!isOpen
                  ? null
                  : filteredInput.map((item) => (
                      <li
                        className={style.item}
                        key={item}
                        {...getItemProps({
                          item,
                        })}
                      >
                        {item}
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
