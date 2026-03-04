import { renderHook, act } from '@testing-library/react';
import { useMediaModal } from '../useMediaModal';

describe('useMediaModal', () => {
  it('should initialize with isModalOpen as false', () => {
    const { result } = renderHook(() => useMediaModal());

    expect(result.current.isModalOpen).toBe(false);
  });

  it('should set isModalOpen to true when handleThumbnailClick is called', () => {
    const { result } = renderHook(() => useMediaModal());

    act(() => {
      result.current.handleThumbnailClick();
    });

    expect(result.current.isModalOpen).toBe(true);
  });

  it('should set isModalOpen to false when handleModalClose is called', () => {
    const { result } = renderHook(() => useMediaModal());

    // First open the modal
    act(() => {
      result.current.handleThumbnailClick();
    });
    expect(result.current.isModalOpen).toBe(true);

    // Then close it
    act(() => {
      result.current.handleModalClose();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('should call onModalOpen callback when handleThumbnailClick is called', () => {
    const onModalOpen = jest.fn();
    const { result } = renderHook(() => useMediaModal(onModalOpen));

    act(() => {
      result.current.handleThumbnailClick();
    });

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when handleModalClose is called', () => {
    const onModalClose = jest.fn();
    const { result } = renderHook(() => useMediaModal(undefined, onModalClose));

    // First open the modal
    act(() => {
      result.current.handleThumbnailClick();
    });

    // Then close it
    act(() => {
      result.current.handleModalClose();
    });

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined callbacks gracefully', () => {
    const { result } = renderHook(() => useMediaModal(undefined, undefined));

    // Should not throw
    act(() => {
      result.current.handleThumbnailClick();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.handleModalClose();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('should toggle modal state correctly on multiple clicks', () => {
    const { result } = renderHook(() => useMediaModal());

    act(() => {
      result.current.handleThumbnailClick();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.handleModalClose();
    });
    expect(result.current.isModalOpen).toBe(false);

    act(() => {
      result.current.handleThumbnailClick();
    });
    expect(result.current.isModalOpen).toBe(true);
  });
});
