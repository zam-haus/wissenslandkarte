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
import { RemovableItem, RemovableItemComponent, type RemovableItemProps } from "./removable-item";

type MultiSelectProps = {
  valuesToSuggest: string[];
  chosenValues: string[];
  inputPlaceholder: string;
  inputName: string;
  minRequired?: number;
  maxAllowed?: number;
  onValueChosen: (value: string) => void;
  onValueRemoved: (value: string) => void;
  onFilterInput?: (filterInput: string) => void;
  allowAddingNew?: boolean;
  removableItemComponent?: RemovableItemComponent;
};
export function MultiSelect(props: MultiSelectProps) {
  const renderSelectedItem =
    props.removableItemComponent ?? ((props: RemovableItemProps) => <RemovableItem {...props} />);

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
  const { getInputProps, getItemProps, getMenuProps, highlightedIndex } = useCombobox({
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

  const invalidIfTooFewValues = props.chosenValues.length < (props.minRequired ?? 0);
  const renderSelection = props.chosenValues.length < (props.maxAllowed ?? Infinity);

  return (
    <div className={style.chosenItemsWrapper} onClick={focusInputElement}>
      {props.chosenValues.map((item) => (
        <Fragment key={item}>
          {renderSelectedItem({ value: item, onRemove: () => props.onValueRemoved(item) })}
          <input type="hidden" name={props.inputName} value={item} />
        </Fragment>
      ))}

      <div className={`field small small-round border no-margin`}>
        {renderSelection ? (
          <>
            <input placeholder={props.inputPlaceholder} required={invalidIfTooFewValues} />

            <menu {...getMenuProps()} className="min">
              <li>
                <div className="field large prefix">
                  <i className="front">arrow_back</i>
                  <input {...getInputProps({ ref: inputElementRef, onKeyDown: onInputKeyDown })} />
                </div>
              </li>
              {filteredInput.map((item, index) => (
                <li
                  key={item}
                  className={index === highlightedIndex ? "active" : ""}
                  {...getItemProps({
                    item,
                  })}
                >
                  <i>add</i>
                  {item}
                </li>
              ))}
            </menu>
          </>
        ) : null}
      </div>
    </div>
  );
}
