export interface TemplateTrigger {
  /** Button label shown in the UI, e.g. "Print Prescription" */
  label: string;
  /** Optional keyboard shortcut character, e.g. "p" */
  shortcutKey?: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  /** Groups templates by purpose, e.g. "medications", "patientRegistration" */
  category: string;
  triggers: TemplateTrigger[];
  outputFormats: Array<'html' | 'pdf'>;
}

export interface TemplateListResponse {
  templates: TemplateInfo[];
}

export interface RenderRequest {
  templateId: string;
  format: 'html' | 'pdf';
  locale?: string;
  /**
   * Identifiers forwarded to data-config.json source params.
   * Common keys: patientUuid, encounterUuid, visitUuid, visitType.
   * For selective print pass selectedIds as comma-separated resource IDs.
   */
  context?: Record<string, string>;
  /** Caller-supplied data (passthrough / hybrid mode) */
  data?: Record<string, unknown>;
}
