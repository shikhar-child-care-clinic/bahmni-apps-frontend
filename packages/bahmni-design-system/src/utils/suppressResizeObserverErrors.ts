// Suppresses Carbon autoAlign ResizeObserver loop errors globally.
// Registered in capture phase so it runs before React's dev overlay handler.
// Intentionally covers all Carbon autoAlign components (ComboBox, Dropdown, MultiSelect, etc.).
export const suppressResizeObserverErrors = () => {
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
};
