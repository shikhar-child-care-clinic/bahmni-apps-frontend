import {
  ObservationForm,
  ObservationDataInFormControls,
} from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import { useObservationFormActions } from '../useObservationFormActions';

describe('useObservationFormActions', () => {
  const mockForm: ObservationForm = {
    uuid: 'form-1',
    name: 'Test Form',
    id: 1,
    privileges: [],
  };

  const mockObservations: ObservationDataInFormControls[] = [
    {
      concept: {
        uuid: 'concept-1',
        datatype: 'Text',
      },
      value: 'Test Value',
    },
  ];

  const mockOnViewingFormChange = jest.fn();
  const mockOnRemoveForm = jest.fn();
  const mockOnFormObservationsChange = jest.fn();
  const mockClearFormData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    viewingForm: mockForm,
    onViewingFormChange: mockOnViewingFormChange,
    onRemoveForm: mockOnRemoveForm,
    observations: mockObservations,
    onFormObservationsChange: mockOnFormObservationsChange,
    clearFormData: mockClearFormData,
  };

  describe('handleDiscardForm', () => {
    it('should clear form data and call onRemoveForm and onViewingFormChange', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleDiscardForm();
      });

      expect(mockClearFormData).toHaveBeenCalledTimes(1);
      expect(mockOnRemoveForm).toHaveBeenCalledWith('form-1');
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should clear form data and call onViewingFormChange even when onRemoveForm is not provided', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          onRemoveForm: undefined,
        }),
      );

      act(() => {
        result.current.handleDiscardForm();
      });

      expect(mockClearFormData).toHaveBeenCalledTimes(1);
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should not call onRemoveForm when viewingForm is null', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          viewingForm: null,
        }),
      );

      act(() => {
        result.current.handleDiscardForm();
      });

      expect(mockClearFormData).toHaveBeenCalledTimes(1);
      expect(mockOnRemoveForm).not.toHaveBeenCalled();
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should not call onRemoveForm when viewingForm is undefined', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          viewingForm: undefined,
        }),
      );

      act(() => {
        result.current.handleDiscardForm();
      });

      expect(mockClearFormData).toHaveBeenCalledTimes(1);
      expect(mockOnRemoveForm).not.toHaveBeenCalled();
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should maintain stable reference across rerenders', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormActions(props),
        {
          initialProps: defaultProps,
        },
      );

      const firstReference = result.current.handleDiscardForm;

      rerender(defaultProps);

      expect(result.current.handleDiscardForm).toBe(firstReference);
    });
  });

  describe('handleSaveForm', () => {
    it('should save observations and call onViewingFormChange', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleSaveForm();
      });

      expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
        'form-1',
        mockObservations,
      );
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should not save when viewingForm is null', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          viewingForm: null,
        }),
      );

      act(() => {
        result.current.handleSaveForm();
      });

      expect(mockOnFormObservationsChange).not.toHaveBeenCalled();
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should not save when onFormObservationsChange is not provided', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          onFormObservationsChange: undefined,
        }),
      );

      act(() => {
        result.current.handleSaveForm();
      });

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should call onViewingFormChange even when save conditions are not met', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          viewingForm: null,
          onFormObservationsChange: undefined,
        }),
      );

      act(() => {
        result.current.handleSaveForm();
      });

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should maintain stable reference across rerenders', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormActions(props),
        {
          initialProps: defaultProps,
        },
      );

      const firstReference = result.current.handleSaveForm;

      rerender(defaultProps);

      expect(result.current.handleSaveForm).toBe(firstReference);
    });

    it('should save with empty observations array', () => {
      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          observations: [],
        }),
      );

      act(() => {
        result.current.handleSaveForm();
      });

      expect(mockOnFormObservationsChange).toHaveBeenCalledWith('form-1', []);
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should save with multiple observations', () => {
      const multipleObservations: ObservationDataInFormControls[] = [
        {
          concept: { uuid: 'concept-1', datatype: 'Text' },
          value: 'Value 1',
        },
        {
          concept: { uuid: 'concept-2', datatype: 'Numeric' },
          value: '42',
        },
      ];

      const { result } = renderHook(() =>
        useObservationFormActions({
          ...defaultProps,
          observations: multipleObservations,
        }),
      );

      act(() => {
        result.current.handleSaveForm();
      });

      expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
        'form-1',
        multipleObservations,
      );
    });
  });

  describe('handleBackToForms', () => {
    it('should call onViewingFormChange with null', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleBackToForms();
      });

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should not clear form data', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleBackToForms();
      });

      expect(mockClearFormData).not.toHaveBeenCalled();
    });

    it('should not call onRemoveForm', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleBackToForms();
      });

      expect(mockOnRemoveForm).not.toHaveBeenCalled();
    });

    it('should maintain stable reference across rerenders', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormActions(props),
        {
          initialProps: defaultProps,
        },
      );

      const firstReference = result.current.handleBackToForms;

      rerender(defaultProps);

      expect(result.current.handleBackToForms).toBe(firstReference);
    });
  });

  describe('Callback Stability', () => {
    it('should update callbacks when dependencies change', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormActions(props),
        {
          initialProps: defaultProps,
        },
      );

      const firstSaveRef = result.current.handleSaveForm;

      // Change a dependency
      const newProps = {
        ...defaultProps,
        observations: [
          { concept: { uuid: 'new', datatype: 'Text' }, value: 'new' },
        ],
      };

      rerender(newProps);

      // Reference should change when dependencies change
      expect(result.current.handleSaveForm).not.toBe(firstSaveRef);
    });

    it('should maintain callback references when non-dependencies change', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormActions(props),
        {
          initialProps: defaultProps,
        },
      );

      const firstBackRef = result.current.handleBackToForms;

      // Change something that's not a dependency of handleBackToForms
      const newProps = {
        ...defaultProps,
        observations: [
          { concept: { uuid: 'new', datatype: 'Text' }, value: 'new' },
        ],
      };

      rerender(newProps);

      // handleBackToForms should maintain reference (only depends on onViewingFormChange)
      expect(result.current.handleBackToForms).toBe(firstBackRef);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle discard followed by save correctly', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleDiscardForm();
      });

      expect(mockClearFormData).toHaveBeenCalledTimes(1);
      expect(mockOnRemoveForm).toHaveBeenCalledWith('form-1');
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);

      jest.clearAllMocks();

      act(() => {
        result.current.handleSaveForm();
      });

      // Should still work and save the observations
      expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
        'form-1',
        mockObservations,
      );
    });

    it('should handle back followed by discard correctly', () => {
      const { result } = renderHook(() =>
        useObservationFormActions(defaultProps),
      );

      act(() => {
        result.current.handleBackToForms();
      });

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
      expect(mockClearFormData).not.toHaveBeenCalled();

      jest.clearAllMocks();

      act(() => {
        result.current.handleDiscardForm();
      });

      expect(mockClearFormData).toHaveBeenCalledTimes(1);
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });
  });
});
