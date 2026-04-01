import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import { useEffect, useRef, useState } from 'react';

export type ComboBoxProps<T> = CarbonComboBoxProps<T> & {
  testId?: string;
  'data-testid'?: string;
  clearSelectedOnChange?: boolean;
};

export const ComboBox = <T,>({
  testId,
  'data-testid': dataTestId,
  selectedItem: externalSelectedItem,
  clearSelectedOnChange = false,
  onChange,
  ...carbonProps
}: ComboBoxProps<T>) => {
  const [displayItem, setDisplayItem] = useState<T | null>(
    (externalSelectedItem as T) ?? null,
  );
  const [comboboxKey, setComboboxKey] = useState(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (clearSelectedOnChange && externalSelectedItem) {
      setDisplayItem(null);
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setComboboxKey((k) => k + 1), 0);
      return () => clearTimeout(clearTimerRef.current);
    } else {
      setDisplayItem((externalSelectedItem as T) ?? null);
    }
  }, [externalSelectedItem, clearSelectedOnChange]);

  useEffect(() => () => clearTimeout(clearTimerRef.current), []);

  const handleChange = (
    event: Parameters<NonNullable<CarbonComboBoxProps<T>['onChange']>>[0],
  ) => {
    onChange?.(event);
    if (clearSelectedOnChange && event.selectedItem) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setComboboxKey((k) => k + 1), 0);
    }
  };

  return (
    <CarbonComboBox<T>
      key={comboboxKey}
      {...carbonProps}
      onChange={handleChange}
      selectedItem={displayItem}
      data-testid={testId ?? dataTestId}
    />
  );
};
