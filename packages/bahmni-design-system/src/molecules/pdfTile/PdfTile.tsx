import classNames from 'classnames';
import React from 'react';
import { Modal } from '../../atoms/modal';
import { useMediaModal } from '../hooks';
import styles from './styles/PdfTile.module.scss';

export interface PdfTileProps {
  pdfSrc: string;
  id: string;
  className?: string;
  modalTitle?: string;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

const baseURL = '/openmrs/auth?requested_document=/document_images/';

export const PdfTile: React.FC<PdfTileProps> = ({
  pdfSrc,
  id,
  className,
  modalTitle,
  onModalOpen,
  onModalClose,
}) => {
  const { isModalOpen, handleThumbnailClick, handleModalClose } = useMediaModal(
    onModalOpen,
    onModalClose,
  );

  return (
    <>
      <button
        id={id}
        data-testid={`${id}-test-id`}
        aria-label={`${id}-aria-label`}
        type="button"
        className={classNames(styles.thumbnailButton, className)}
        onClick={handleThumbnailClick}
      >
        <div
          id={`${id}-thumbnail`}
          data-testid={`${id}-thumbnail-test-id`}
          aria-label={`${id}-thumbnail-aria-label`}
          className={styles.pdfThumbnail}
        >
          📄
        </div>
      </button>

      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onRequestClose={handleModalClose}
          modalHeading={modalTitle}
          passiveModal
          size="lg"
          id="modalIdForPdfTile"
          testId={`${id}-modal-test-id`}
        >
          <div className={styles.modalPdfContainer}>
            <embed
              id={`${id}-modal-pdf`}
              data-testid={`${id}-modal-pdf-test-id`}
              aria-label={`${id}-modal-pdf-aria-label`}
              src={baseURL + pdfSrc}
              type="application/pdf"
              className={styles.modalPdf}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default PdfTile;
