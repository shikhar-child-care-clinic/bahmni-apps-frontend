import { Button } from '@carbon/react';
import React, { useRef } from 'react';
import { Modal } from '../../atoms/modal';
import styles from './PrintModal.module.scss';

export interface PrintModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the user clicks Cancel or the X button */
  onClose: () => void;
  /** Human-readable name of the document being printed */
  documentName?: string;
  /** True while the HTML content is being fetched from the template service */
  isLoading?: boolean;
  /** Error message to display instead of the preview */
  error?: string | null;
  /** The HTML string returned by the template service */
  htmlContent?: string | null;
}

const PrintModal: React.FC<PrintModalProps> = ({
  open,
  onClose,
  documentName = 'Document',
  isLoading = false,
  error = null,
  htmlContent = null,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const canPrint = !isLoading && !error && Boolean(htmlContent);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      passiveModal
      modalHeading={documentName}
      size="lg"
      className={styles.printModal}
    >
      {isLoading && (
        <div className={styles.loadingState} role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p>Preparing document…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className={styles.errorState} role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && htmlContent && (
        <div className={styles.previewContainer}>
          <iframe
            ref={iframeRef}
            className={styles.preview}
            srcDoc={htmlContent}
            title={`${documentName} preview`}
            sandbox="allow-scripts allow-same-origin allow-modals"
          />
        </div>
      )}

      <div className={styles.footer}>
        <Button kind="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!canPrint} onClick={handlePrint}>
          Print
        </Button>
      </div>
    </Modal>
  );
};

export default PrintModal;
