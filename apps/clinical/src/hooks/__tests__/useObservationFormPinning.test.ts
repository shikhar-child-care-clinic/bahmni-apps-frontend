import { ObservationForm } from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import { useObservationFormPinning } from '../useObservationFormPinning';

describe('useObservationFormPinning', () => {
  const mockForm1: ObservationForm = {
    uuid: 'form-1',
    name: 'Test Form 1',
    id: 1,
    privileges: [],
  };

  const mockForm2: ObservationForm = {
    uuid: 'form-2',
    name: 'Test Form 2',
    id: 2,
    privileges: [],
  };

  const mockUpdatePinnedForms = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isCurrentFormPinned', () => {
    it('should return false when viewingForm is null', () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: null,
          pinnedForms: [mockForm1],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      expect(result.current.isCurrentFormPinned).toBe(false);
    });

    it('should return false when viewingForm is undefined', () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: undefined,
          pinnedForms: [mockForm1],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      expect(result.current.isCurrentFormPinned).toBe(false);
    });

    it('should return false when pinnedForms is empty', () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      expect(result.current.isCurrentFormPinned).toBe(false);
    });

    it('should return true when viewingForm is in pinnedForms', () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [mockForm1, mockForm2],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      expect(result.current.isCurrentFormPinned).toBe(true);
    });

    it('should return false when viewingForm is not in pinnedForms', () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [mockForm2],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      expect(result.current.isCurrentFormPinned).toBe(false);
    });

    it('should update when viewingForm changes', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormPinning(props),
        {
          initialProps: {
            viewingForm: mockForm1,
            pinnedForms: [mockForm1],
            updatePinnedForms: mockUpdatePinnedForms,
          },
        },
      );

      expect(result.current.isCurrentFormPinned).toBe(true);

      rerender({
        viewingForm: mockForm2,
        pinnedForms: [mockForm1],
        updatePinnedForms: mockUpdatePinnedForms,
      });

      expect(result.current.isCurrentFormPinned).toBe(false);
    });

    it('should update when pinnedForms changes', () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormPinning(props),
        {
          initialProps: {
            viewingForm: mockForm1,
            pinnedForms: [],
            updatePinnedForms: mockUpdatePinnedForms,
          },
        },
      );

      expect(result.current.isCurrentFormPinned).toBe(false);

      rerender({
        viewingForm: mockForm1,
        pinnedForms: [mockForm1],
        updatePinnedForms: mockUpdatePinnedForms,
      });

      expect(result.current.isCurrentFormPinned).toBe(true);
    });
  });

  describe('handlePinToggle', () => {
    it('should add form to pinnedForms when not already pinned', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([mockForm1]);
    });

    it('should remove form from pinnedForms when already pinned', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [mockForm1, mockForm2],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([mockForm2]);
    });

    it('should not call updatePinnedForms when viewingForm is null', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: null,
          pinnedForms: [mockForm1],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockUpdatePinnedForms).not.toHaveBeenCalled();
    });

    it('should not call updatePinnedForms when viewingForm is undefined', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: undefined,
          pinnedForms: [mockForm1],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockUpdatePinnedForms).not.toHaveBeenCalled();
    });

    it('should preserve other pinned forms when adding a new one', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm2,
          pinnedForms: [mockForm1],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([
        mockForm1,
        mockForm2,
      ]);
    });

    it('should preserve order of other pinned forms when removing', async () => {
      const mockForm3: ObservationForm = {
        uuid: 'form-3',
        name: 'Test Form 3',
        id: 3,
        privileges: [],
      };

      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm2,
          pinnedForms: [mockForm1, mockForm2, mockForm3],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([
        mockForm1,
        mockForm3,
      ]);
    });
  });

  describe('Integration Scenarios', () => {
    it('should toggle pin status correctly through multiple interactions', async () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormPinning(props),
        {
          initialProps: {
            viewingForm: mockForm1,
            pinnedForms: [],
            updatePinnedForms: mockUpdatePinnedForms,
          },
        },
      );

      expect(result.current.isCurrentFormPinned).toBe(false);

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      // Pin the form
      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([mockForm1]);

      // Simulate the state update
      rerender({
        viewingForm: mockForm1,
        pinnedForms: [mockForm1],
        updatePinnedForms: mockUpdatePinnedForms,
      });

      expect(result.current.isCurrentFormPinned).toBe(true);

      jest.clearAllMocks();

      // Unpin the form
      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);

      // Simulate the state update
      rerender({
        viewingForm: mockForm1,
        pinnedForms: [],
        updatePinnedForms: mockUpdatePinnedForms,
      });

      expect(result.current.isCurrentFormPinned).toBe(false);
    });

    it('should handle switching between different forms', async () => {
      const { result, rerender } = renderHook(
        (props) => useObservationFormPinning(props),
        {
          initialProps: {
            viewingForm: mockForm1,
            pinnedForms: [mockForm1],
            updatePinnedForms: mockUpdatePinnedForms,
          },
        },
      );

      expect(result.current.isCurrentFormPinned).toBe(true);

      // Switch to a different form
      rerender({
        viewingForm: mockForm2,
        pinnedForms: [mockForm1],
        updatePinnedForms: mockUpdatePinnedForms,
      });

      expect(result.current.isCurrentFormPinned).toBe(false);

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      // Pin the new form
      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([
        mockForm1,
        mockForm2,
      ]);
    });

    it('should handle empty pinnedForms array correctly', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      expect(result.current.isCurrentFormPinned).toBe(false);

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([mockForm1]);
    });
  });

  describe('Event Handling', () => {
    it('should always prevent default and stop propagation', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: mockForm1,
          pinnedForms: [],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should prevent default and stop propagation even when viewingForm is null', async () => {
      const { result } = renderHook(() =>
        useObservationFormPinning({
          viewingForm: null,
          pinnedForms: [],
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      await act(async () => {
        result.current.handlePinToggle(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    });
  });
});
