import { act, render, screen } from '@testing-library/react';
import { ComboBox } from '..';

type Item = { label: string; value: string };

const items: Item[] = [
  { label: 'Hypertension', value: 'hypertension' },
  { label: 'Diabetes', value: 'diabetes' },
];

const defaultProps = {
  id: 'test-combobox',
  items,
  itemToString: (item: Item | null) => item?.label ?? '',
  onChange: jest.fn(),
};

describe('ComboBox', () => {
  describe('clearSelectedOnChange=false (default)', () => {
    it('should display the selected item in the input', () => {
      render(<ComboBox {...defaultProps} selectedItem={items[0]} />);

      expect(screen.getByRole('combobox')).toHaveValue('Hypertension');
    });

    it('should update display when selectedItem changes', () => {
      const { rerender } = render(
        <ComboBox {...defaultProps} selectedItem={items[0]} />,
      );

      rerender(<ComboBox {...defaultProps} selectedItem={items[1]} />);

      expect(screen.getByRole('combobox')).toHaveValue('Diabetes');
    });
  });

  describe('clearSelectedOnChange=true', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should clear the input after an item is selected', () => {
      const { rerender } = render(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={null}
        />,
      );

      rerender(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={items[0]}
        />,
      );

      act(() => jest.runAllTimers());

      expect(screen.getByRole('combobox')).toHaveValue('');
    });

    it('should clear input on each subsequent selection', () => {
      const { rerender } = render(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={null}
        />,
      );

      rerender(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={items[0]}
        />,
      );

      act(() => jest.runAllTimers());

      expect(screen.getByRole('combobox')).toHaveValue('');

      rerender(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={items[1]}
        />,
      );

      act(() => jest.runAllTimers());

      expect(screen.getByRole('combobox')).toHaveValue('');
    });
  });
});
