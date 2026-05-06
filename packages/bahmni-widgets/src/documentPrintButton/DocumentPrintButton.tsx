import { Button, Dropdown, PrintModal } from '@bahmni/design-system';
import type { TemplateInfo } from '@bahmni/services';
import { useTranslation } from '@bahmni/services';
import { useState } from 'react';
import styles from './DocumentPrintButton.module.scss';
import { useDocumentTemplatesForCategory } from './useDocumentTemplates';
import { usePrintDocument } from './usePrintDocument';

interface DocumentPrintButtonProps {
  /** Template category used to filter templates, e.g. "patientRegistration", "medications" */
  category: string;
  /** Context object passed to the template render API (patientUuid, encounterUuid, etc.) */
  renderContext: Record<string, string>;
  /** Fallback template ID used when no template is active yet */
  fallbackTemplateId: string;
  /** Button/MenuButton label — used as the MenuButton label when multiple templates exist */
  defaultLabel: string;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

export const DocumentPrintButton = ({
  category,
  renderContext,
  fallbackTemplateId,
  defaultLabel,
  size,
  'data-testid': dataTestId,
}: DocumentPrintButtonProps) => {
  const { t } = useTranslation();
  const { templates } = useDocumentTemplatesForCategory(category);
  const [activeTemplate, setActiveTemplate] = useState<TemplateInfo | null>(
    null,
  );

  const resolvedTemplate = activeTemplate ?? templates[0] ?? null;

  const {
    isModalOpen,
    openModal,
    closeModal,
    htmlContent,
    isLoadingHtml,
    htmlError,
  } = usePrintDocument({
    templateId: resolvedTemplate?.id ?? fallbackTemplateId,
    context: renderContext,
  });

  if (templates.length === 0) return null;

  const triggerLabel = (tmpl: TemplateInfo) =>
    tmpl.triggers[0]?.label ?? tmpl.name;

  return (
    <>
      {templates.length === 1 ? (
        <Button
          kind="ghost"
          size={size}
          data-testid={dataTestId}
          onClick={() => {
            setActiveTemplate(templates[0]);
            openModal();
          }}
        >
          {triggerLabel(templates[0])}
        </Button>
      ) : (
        <div className={styles.printButtonGroup}>
          <Button
            kind="tertiary"
            size={size}
            className={styles.printButton}
            data-testid={dataTestId}
            onClick={() => {
              setActiveTemplate(templates[0]);
              openModal();
            }}
          >
            {triggerLabel(templates[0])}
          </Button>
          <Dropdown
            id={`print-dropdown-${dataTestId ?? 'default'}`}
            className={styles.printDropdown}
            items={templates.slice(1)}
            itemToString={(item) => (item ? triggerLabel(item) : '')}
            onChange={({ selectedItem }) => {
              if (selectedItem) {
                setActiveTemplate(selectedItem);
                openModal();
              }
            }}
            label=""
            type="inline"
            size={size ?? 'lg'}
            titleText=""
            selectedItem={null}
          />
        </div>
      )}

      {isModalOpen && resolvedTemplate && (
        <PrintModal
          open={isModalOpen}
          onClose={closeModal}
          documentName={resolvedTemplate.name}
          isLoading={isLoadingHtml}
          error={htmlError}
          htmlContent={htmlContent}
          cancelLabel={t('PRINT_MODAL_CANCEL')}
          printLabel={t('PRINT_MODAL_PRINT')}
          loadingLabel={t('PRINT_MODAL_PREPARING_DOCUMENT')}
        />
      )}
    </>
  );
};
