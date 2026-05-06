import {
  Button,
  MenuItem,
  MenuButton,
  PrintModal,
} from '@bahmni/design-system';
import type { TemplateInfo } from '@bahmni/services';
import { useState } from 'react';
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
        <MenuButton
          label={defaultLabel}
          kind="ghost"
          size={size}
          data-testid={dataTestId}
        >
          {templates.map((tmpl) => (
            <MenuItem
              key={tmpl.id}
              label={triggerLabel(tmpl)}
              onClick={() => {
                setActiveTemplate(tmpl);
                openModal();
              }}
            />
          ))}
        </MenuButton>
      )}

      {isModalOpen && resolvedTemplate && (
        <PrintModal
          open={isModalOpen}
          onClose={closeModal}
          documentName={resolvedTemplate.name}
          isLoading={isLoadingHtml}
          error={htmlError}
          htmlContent={htmlContent}
        />
      )}
    </>
  );
};
