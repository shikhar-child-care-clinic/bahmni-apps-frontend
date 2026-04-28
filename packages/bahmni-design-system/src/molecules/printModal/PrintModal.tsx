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
  /**
   * Called when the user clicks "Download PDF".
   * If undefined, the button is not rendered.
   */
  onDownloadPdf?: () => void;
  /** True while the PDF is being generated (disables the Download PDF button) */
  isDownloadingPdf?: boolean;
}

/**
 * PrintModal
 *
 * Displays a document preview inside an iframe and provides Print and
 * optional Download PDF actions.
 *
 * The Print button calls iframeRef.current.contentWindow.print() which triggers
 * the browser's native print dialog scoped to the iframe — not the host page.
 * The HTML returned by the template service already contains @media print CSS
 * that hides everything except the document content.
 */
const PrintModal: React.FC<PrintModalProps> = ({
  open,
  onClose,
  documentName = 'Document',
  isLoading = false,
  error = null,
  htmlContent = null,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const canPrint = !isLoading && !error && Boolean(htmlContent);

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      passiveModal
      size="lg"
      className={styles.printModal}
      aria-labelledby="print-modal-title"
    >
      <div className={styles.modalHeader}>
        <h3 id="print-modal-title">{documentName}</h3>
      </div>

      <div className={styles.modalBody}>
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
          <iframe
            ref={iframeRef}
            className={styles.preview}
            srcDoc={htmlContent}
            title={`${documentName} preview`}
            sandbox="allow-scripts allow-same-origin allow-modals"
          />
        )}
      </div>

      <div className={styles.modalFooter}>
        {onDownloadPdf && (
          <Button
            kind="secondary"
            onClick={onDownloadPdf}
            disabled={!canPrint || isDownloadingPdf}
          >
            {isDownloadingPdf ? 'Generating PDF…' : 'Download PDF'}
          </Button>
        )}

        <Button onClick={handlePrint} disabled={!canPrint}>
          Print
        </Button>

        <Button kind="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default PrintModal;
