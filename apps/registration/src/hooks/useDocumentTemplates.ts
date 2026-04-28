import { getTemplates } from '@bahmni/services';
import type { TemplateInfo } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

function useAllTemplates(): { templates: TemplateInfo[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['documentTemplates'],
    queryFn: () =>
      getTemplates().catch(() => ({ templates: [] as TemplateInfo[] })),
    staleTime: 5 * 60 * 1000, // 5 minutes — template list changes rarely
    retry: false, // don't retry if service is down
  });

  return {
    templates: data?.templates ?? [],
    isLoading,
  };
}

/**
 * Returns templates whose triggers include the given context string.
 *
 * If the template service is unavailable, returns an empty array so no
 * print buttons appear — a missing service should not surface errors.
 *
 * Common contexts: "medications", "encounter", "patientRegistration"
 */
export function useDocumentTemplatesForContext(context: string): {
  templates: TemplateInfo[];
  isLoading: boolean;
} {
  const { templates, isLoading } = useAllTemplates();

  const filtered = templates.filter((t) =>
    t.triggers.some((trigger) => trigger.context === context),
  );

  return { templates: filtered, isLoading };
}
