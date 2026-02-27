import {
  SortableDataTable,
  Modal,
} from '@bahmni/design-system';
import {
  useTranslation,
  formatDate,
  DATE_TIME_FORMAT,
  useSubscribeConsultationSaved,
  getDocumentReferences,
} from '@bahmni/services';
import { DocumentPdf, Image, Document } from '@carbon/icons-react';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { DocumentViewModel } from './models';
import styles from './styles/DocumentsTable.module.scss';
import {
  mapDocumentReferencesToViewModels,
  getFileTypeCategory,
  buildDocumentUrl,
  createDocumentHeaders,
} from './utils';

const fetchDocuments = async (
  patientUUID: string,
  encounterUuids?: string[],
): Promise<DocumentViewModel[]> => {
  const bundle = await getDocumentReferences(patientUUID, encounterUuids);
  return mapDocumentReferencesToViewModels(
    (bundle.entry || []) as any[],
  );
};

/**
 * Component to display patient documents using SortableDataTable
 */
const DocumentsTable: React.FC<WidgetProps> = ({
  config,
  encounterUuids,
}) => {
  const [documents, setDocuments] = useState<DocumentViewModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentViewModel | null>(null);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const handleIconClick = useCallback((doc: DocumentViewModel) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDoc(null);
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['documents', patientUUID!, encounterUuids],
    enabled: !!patientUUID,
    queryFn: () => fetchDocuments(patientUUID!, encounterUuids),
  });

  // Listen to consultation saved events and refetch if documents were updated
  useSubscribeConsultationSaved(
    (payload) => {
      // TODO: add resource key for documents when consultation event includes document updates
      if (payload.patientUUID === patientUUID) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    }
    if (data) {
      setDocuments(data);
    }
  }, [data, isLoading, isError, error, addNotification, t]);

  // Define table headers based on configured fields
  const headers = useMemo(
    () => {
      const fields = config?.fields as string[];
      if (!fields || fields.length === 0) {
        return [];
      }
      return createDocumentHeaders(fields, t);
    },
    [config?.fields, t],
  );

  const sortable = useMemo(
    () => {
      const fields = config?.fields as string[];
      if (!fields || fields.length === 0) {
        return [];
      }
      return fields.map((field) => ({
        key: field,
        sortable: true,
      }));
    },
    [config?.fields],
  );

  const renderFileIcon = (contentType?: string) => {
    const fileType = getFileTypeCategory(contentType);
    switch (fileType) {
      case 'pdf':
        return <DocumentPdf size={16} className={styles.pdfIcon} />;
      case 'image':
        return <Image size={16} className={styles.imageIcon} />;
      case 'document':
      default:
        return <Document size={16} className={styles.documentIcon} />;
    }
  };

  // Function to render cell content based on the cell ID
  const renderCell = (doc: DocumentViewModel, cellId: string) => {
    switch (cellId) {
      case 'documentIdentifier':
        return (
          <div className={styles.nameCell}>
            <button
              className={styles.fileIconButton}
              onClick={() => handleIconClick(doc)}
              aria-label={`View ${doc.documentIdentifier}`}
            >
              {renderFileIcon(doc.contentType)}
            </button>
            <span>{doc.documentIdentifier}</span>
          </div>
        );
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
      default:
        return null;
    }
  };

  const docUrl = selectedDoc ? buildDocumentUrl(selectedDoc.documentUrl) : '';
  const isPDF = selectedDoc?.contentType?.toLowerCase().includes('pdf');
  const isImage = selectedDoc?.contentType?.toLowerCase().includes('image');

  return (
    <>
      <div data-testid="documents-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('DOCUMENTS_TABLE_HEADING')}
          rows={documents}
          loading={isLoading}
          errorStateMessage={isError ? error?.message : null}
          sortable={sortable}
          emptyStateMessage={t('DOCUMENTS_NO_RECORDS')}
          renderCell={renderCell}
          className={styles.documentsTableBody}
          dataTestId="documents-table"
        />
      </div>

      {isModalOpen && selectedDoc && (
        <Modal
          id="modalIdForActionAreaLayout"
          open={isModalOpen}
          onRequestClose={handleCloseModal}
          modalHeading={selectedDoc.documentIdentifier}
          passiveModal
          size="lg"
          testId="document-view-modal"
        >
          <div className={styles.documentViewerContainer}>
            {isImage ? (
              <img
                src={docUrl}
                alt={selectedDoc.documentIdentifier}
                className={styles.documentImage}
              />
            ) : (
              <iframe
                src={isPDF ? `${docUrl}#toolbar=0` : docUrl}
                className={styles.documentIframe}
                title={selectedDoc.documentIdentifier}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default DocumentsTable;

// i18n keys used:
// DOCUMENTS_TABLE_HEADING
// DOCUMENTS_NO_RECORDS
// DOCUMENTS_DOCUMENT_IDENTIFIER
// DOCUMENTS_DOCUMENT_TYPE
// DOCUMENTS_UPLOADED_ON
// DOCUMENTS_UPLOADED_BY
// DOCUMENTS_NOT_AVAILABLE
// ERROR_DEFAULT_TITLE
