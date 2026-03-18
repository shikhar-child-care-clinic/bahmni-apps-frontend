import { SortableDataTable, Modal, Link } from '@bahmni/design-system';
import {
  useTranslation,
  formatDate,
  DATE_TIME_FORMAT,
  getFormattedDocumentReferences,
  DocumentViewModel,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import styles from './styles/DocumentsTable.module.scss';
import { buildDocumentUrl, createDocumentHeaders } from './utils';

const DEFAULT_DOCUMENT_FIELDS = [
  'documentIdentifier',
  'documentType',
  'uploadedOn',
  'uploadedBy',
  'action',
];

const DocumentsTable: React.FC<WidgetProps> = ({ config, encounterUuids }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentViewModel | null>(
    null,
  );
  const [failedAttachments, setFailedAttachments] = useState<Set<number>>(
    new Set(),
  );
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const handleViewAttachments = useCallback((doc: DocumentViewModel) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDoc(null);
    setFailedAttachments(new Set());
  }, []);

  const handleAttachmentLoadError = useCallback((index: number) => {
    setFailedAttachments((prev) => new Set(prev).add(index));
  }, []);

  const getNormalizedAttachments = useCallback((doc: DocumentViewModel) => {
    if (doc.attachments.length > 0) {
      return doc.attachments;
    }
    if (doc.documentUrl) {
      return [{ url: doc.documentUrl, contentType: doc.contentType }];
    }
    return [];
  }, []);

  const validateDocumentUrl = useCallback(
    async (url: string): Promise<boolean> => {
      if (!url || url === '#') return false;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    },
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['documents', patientUUID!, encounterUuids],
    enabled: !!patientUUID,
    queryFn: () => getFormattedDocumentReferences(patientUUID!, encounterUuids),
  });

  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message ?? '',
        type: 'error',
      });
    }
  }, [isError, error, addNotification, t]);

  useEffect(() => {
    const validateAttachments = async () => {
      if (!isModalOpen || !selectedDoc) return;

      const failed = new Set<number>();
      const attachments = getNormalizedAttachments(selectedDoc);

      for (let i = 0; i < attachments.length; i++) {
        const url = buildDocumentUrl(attachments[i].url);
        const isValid = await validateDocumentUrl(url);
        if (!isValid) {
          failed.add(i);
        }
      }

      setFailedAttachments(failed);
    };

    validateAttachments();
  }, [isModalOpen, selectedDoc, validateDocumentUrl, getNormalizedAttachments]);

  const fields = useMemo(
    () => (config?.fields as string[]) ?? DEFAULT_DOCUMENT_FIELDS,
    [config?.fields],
  );

  const headers = useMemo(() => createDocumentHeaders(fields, t), [fields, t]);

  const sortable = useMemo(
    () =>
      fields.map((field) => ({
        key: field,
        sortable: field !== 'action',
      })),
    [fields],
  );

  const pageSize = config?.pageSize as number | undefined;

  const renderCell = useCallback(
    (doc: DocumentViewModel, cellId: string) => {
      switch (cellId) {
        case 'documentIdentifier':
          return <span>{doc.documentIdentifier}</span>;
        case 'documentType':
          return doc.documentType ?? t('DOCUMENTS_NOT_AVAILABLE');
        case 'uploadedOn': {
          const formattedDate = formatDate(
            doc.uploadedOn,
            t,
            DATE_TIME_FORMAT,
          ).formattedResult;
          return formattedDate || t('DOCUMENTS_NOT_AVAILABLE');
        }
        case 'uploadedBy':
          return doc.uploadedBy ?? t('DOCUMENTS_NOT_AVAILABLE');
        case 'action': {
          const hasAttachments =
            doc.attachments.length > 0 || !!doc.documentUrl;
          if (!hasAttachments) return '--';
          return (
            <Link
              onClick={() => handleViewAttachments(doc)}
              className={styles.viewAttachmentsLink}
              data-testid={`view-attachments-${doc.id}`}
            >
              {t('DOCUMENTS_VIEW_ATTACHMENTS')}
            </Link>
          );
        }
        default:
          return null;
      }
    },
    [handleViewAttachments, t],
  );

  return (
    <>
      <div data-testid="documents-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('DOCUMENTS_TABLE_HEADING')}
          rows={data ?? []}
          loading={isLoading}
          errorStateMessage={isError ? error?.message : null}
          sortable={sortable}
          emptyStateMessage={t('DOCUMENTS_NO_RECORDS')}
          renderCell={renderCell}
          className={styles.documentsTableBody}
          dataTestId="documents-table"
          pageSize={pageSize}
        />
      </div>

      {isModalOpen && selectedDoc && (
        <Modal
          id="modalIdForActionAreaLayout"
          portalId={'main-display-area'}
          open={isModalOpen}
          onRequestClose={handleCloseModal}
          modalHeading={selectedDoc.documentIdentifier}
          passiveModal
          size="lg"
          testId="document-view-modal"
        >
          <div className={styles.documentViewerContainer}>
            {(() => {
              const normalizedAttachments =
                getNormalizedAttachments(selectedDoc);
              return normalizedAttachments.map((attachment, index) => {
                const url = buildDocumentUrl(attachment.url);
                const isPdf = attachment.contentType
                  ?.toLowerCase()
                  .includes('pdf');
                const isImg = attachment.contentType
                  ?.toLowerCase()
                  .includes('image');
                const hasFailed = failedAttachments.has(index);

                if (url === '#' || hasFailed) {
                  return (
                    <p
                      key={`${selectedDoc.id}-${attachment.url}`}
                      className={styles.attachmentError}
                      data-testid={`attachment-error-${index}`}
                    >
                      {t('DOCUMENTS_ERROR_LOADING_ATTACHMENT')}
                    </p>
                  );
                }
                return (
                  <div
                    key={`${selectedDoc.id}-${attachment.url}`}
                    className={styles.attachmentItem}
                    data-testid={`attachment-item-${index}`}
                  >
                    {normalizedAttachments.length > 1 && (
                      <p className={styles.attachmentCounter}>
                        {index + 1}/{normalizedAttachments.length}
                      </p>
                    )}
                    {isImg ? (
                      <img
                        src={url}
                        alt={selectedDoc.documentIdentifier}
                        className={styles.documentImage}
                        onError={() => handleAttachmentLoadError(index)}
                      />
                    ) : (
                      <iframe
                        src={isPdf ? `${url}#toolbar=0` : url}
                        className={styles.documentIframe}
                        title={selectedDoc.documentIdentifier}
                        onError={() => handleAttachmentLoadError(index)}
                      />
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </Modal>
      )}
    </>
  );
};

export default DocumentsTable;
