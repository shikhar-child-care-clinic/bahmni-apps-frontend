import { useState, useCallback } from 'react';

/**
 * Custom hook to manage media modal state and interactions
 * Reduces code duplication across VideoTile, ImageTile, and PdfTile components
 *
 * @param onModalOpen - Optional callback function triggered when modal opens
 * @param onModalClose - Optional callback function triggered when modal closes
 * @returns Object containing modal state and handler functions
 */
export const useMediaModal = (
  onModalOpen?: () => void,
  onModalClose?: () => void,
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleThumbnailClick = useCallback(() => {
    setIsModalOpen(true);
    onModalOpen?.();
  }, [onModalOpen]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    onModalClose?.();
  }, [onModalClose]);

  return {
    isModalOpen,
    handleThumbnailClick,
    handleModalClose,
  };
};
