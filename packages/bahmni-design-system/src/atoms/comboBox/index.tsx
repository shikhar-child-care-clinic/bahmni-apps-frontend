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

// Carbon's autoAlign uses floating-ui autoUpdate which installs a ResizeObserver.
// When the dropdown opens/closes, the browser may not deliver all ResizeObserver
// notifications in a single frame, dispatching this as a window ErrorEvent. It is
// benign — the browser recovers automatically — but React's dev overlay shows it as
// a fatal error. Registered once at module scope (not per instance) using capture
// phase so it runs before React's overlay handler, rather than suppressing globally
// in index.html. startsWith covers all browser variants (Chrome appends a period,
// Firefox does not).
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (e: ErrorEvent) => {
      if (e.message.startsWith('ResizeObserver loop')) {
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}

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

  // Path 1: parent updates selectedItem prop (InvestigationsForm, ConditionsForm, etc.)
  // Increment comboboxKey to remount Carbon with a clean slate (selectedItem=null,
  // inputValue='') instead of the item→null cycle, which avoids Downshift
  // controlled/uncontrolled warnings. Deferred to a macrotask so it runs after
  // Carbon's autoAlign ResizeObserver callbacks from the dropdown-close complete.
  useEffect(() => {
    if (clearSelectedOnChange && externalSelectedItem) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setComboboxKey((k) => k + 1), 0);
      return () => clearTimeout(clearTimerRef.current);
    } else {
      setDisplayItem((externalSelectedItem as T) ?? null);
    }
  }, [externalSelectedItem, clearSelectedOnChange]);

  useEffect(() => () => clearTimeout(clearTimerRef.current), []);

  // Path 2: parent never updates selectedItem (VaccinationForm keeps it null always).
  // Same deferred key-remount approach as Path 1.
  const handleChange = (
    event: Parameters<CarbonComboBoxProps<T>['onChange']>[0],
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
