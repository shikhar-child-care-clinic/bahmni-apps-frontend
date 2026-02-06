import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';

export type ComboBoxProps<T> = CarbonComboBoxProps<T> & {
  testId?: string;
  'data-testid'?: string;
  clearInputOnSelect?: boolean;
};

export const ComboBox = <T,>({
  testId,
  'data-testid': dataTestId,
  clearInputOnSelect = false,
  ...carbonProps
}: ComboBoxProps<T>) => {
  const finalDownshiftProps = clearInputOnSelect
    ? {
        ...carbonProps.downshiftProps,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stateReducer: (state: any, actionAndChanges: any) => {
          const { changes, type } = actionAndChanges;
          if (
            changes.selectedItem &&
            (type === '__item_click__' || type === '__input_keydown_enter__')
          ) {
            return { ...changes, inputValue: '' };
          }
          return changes;
        },
      }
    : carbonProps.downshiftProps;

  return (
    <CarbonComboBox<T>
      {...carbonProps}
      downshiftProps={finalDownshiftProps}
      data-testid={testId ?? dataTestId}
    />
  );
};
