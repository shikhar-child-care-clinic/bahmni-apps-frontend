import { Button, Dropdown } from '@bahmni/design-system';
import type { TemplateInfo } from '@bahmni/services';
import { useState } from 'react';
import styles from './DocumentPrintButton.module.scss';
import { useDocumentTemplatesForCategory } from './useDocumentTemplates';
import { usePrintDocument } from './usePrintDocument';

interface DocumentPrintButtonProps {
  /** Template category used to filter templates, e.g. "patientRegistration", "medications" */
  category: string;
  /** Context object passed to the template render API (patientUuid, encounterUuid, etc.) */
  renderContext: Record<string, string>;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

export const DocumentPrintButton = ({
  category,
  renderContext,
  size,
  'data-testid': dataTestId,
}: DocumentPrintButtonProps) => {
  const { templates } = useDocumentTemplatesForCategory(category);
  const [activeTemplate, setActiveTemplate] = useState<TemplateInfo | null>(
    null,
  );

  const resolvedTemplate = activeTemplate ?? templates[0] ?? null;

  const { triggerPrint } = usePrintDocument({
    templateId: resolvedTemplate?.id,
    context: renderContext,
  });

  if (templates.length === 0) return null;

  const triggerLabel = (tmpl: TemplateInfo) =>
    tmpl.triggers[0]?.label ?? tmpl.name;

  const handlePrint = (template: TemplateInfo) => {
    setActiveTemplate(template);
    triggerPrint();
  };

  return (
    <>
      {templates.length === 1 ? (
        <Button
          kind="ghost"
          size={size}
          data-testid={dataTestId}
          onClick={() => handlePrint(templates[0])}
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
            onClick={() => handlePrint(templates[0])}
          >
            {triggerLabel(templates[0])}
          </Button>
          <Dropdown
            id={`print-dropdown-${dataTestId ?? 'default'}`}
            className={styles.printDropdown}
            items={templates.slice(1)}
            itemToString={(item) => (item ? triggerLabel(item) : '')}
            onChange={({ selectedItem }) => {
              if (selectedItem) handlePrint(selectedItem);
            }}
            label=""
            type="inline"
            size={size ?? 'lg'}
            titleText=""
            selectedItem={null}
          />
        </div>
      )}
    </>
  );
};
