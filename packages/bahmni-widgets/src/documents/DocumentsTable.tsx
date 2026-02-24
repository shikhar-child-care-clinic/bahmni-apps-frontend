import {
  SortableDataTable,
  Link as DesignSystemLink,
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
import React, { useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { DocumentViewModel } from './models';
import styles from './styles/DocumentsTable.module.scss';
import {
  mapDocumentReferencesToViewModels,
  getFileTypeCategory,
  buildDocumentUrl,
} from './utils';

const fetchDocuments = async (
  patientUUID: string,
  encounterUuids?: string[],
): Promise<DocumentViewModel[]> => {
  const bundle = await getDocumentReferences(patientUUID, encounterUuids);
  return mapDocumentReferencesToViewModels(bundle.entry || []);
};

/**
 * Component to display patient documents using SortableDataTable
 */
const DocumentsTable: React.FC<WidgetProps> = ({ encounterUuids }) => {
  const [documents, setDocuments] = useState<DocumentViewModel[]>([]);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

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

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'name', header: t('DOCUMENTS_NAME') },
      { key: 'documentType', header: t('DOCUMENTS_DOCUMENT_TYPE') },
      { key: 'uploadedOn', header: t('DOCUMENTS_UPLOADED_ON') },
      { key: 'uploadedBy', header: t('DOCUMENTS_UPLOADED_BY') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'name', sortable: true },
      { key: 'documentType', sortable: true },
      { key: 'uploadedOn', sortable: true },
      { key: 'uploadedBy', sortable: true },
    ],
    [],
  );

  // Render file type icon based on content type
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
      case 'name':
        return (
          <div className={styles.nameCell}>
            <span className={styles.fileIcon}>
              {renderFileIcon(doc.contentType)}
            </span>
            <DesignSystemLink
              href={buildDocumentUrl(doc.documentUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {doc.name}
            </DesignSystemLink>
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

  return (
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
  );
};

export default DocumentsTable;

// i18n keys used:
// DOCUMENTS_TABLE_HEADING
// DOCUMENTS_NO_RECORDS
// DOCUMENTS_NAME
// DOCUMENTS_DOCUMENT_TYPE
// DOCUMENTS_UPLOADED_ON
// DOCUMENTS_UPLOADED_BY
// DOCUMENTS_NOT_AVAILABLE
// ERROR_DEFAULT_TITLE
