import { getTemplates } from '@bahmni/services';
import type { TemplateInfo } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

function useAllTemplates(): { templates: TemplateInfo[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['documentTemplates'],
    queryFn: () =>
      getTemplates().catch(() => ({ templates: [] as TemplateInfo[] })),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    templates: data?.templates ?? [],
    isLoading,
  };
}

export function useDocumentTemplatesForCategory(category: string): {
  templates: TemplateInfo[];
  isLoading: boolean;
} {
  const { templates, isLoading } = useAllTemplates();

  const filtered = templates.filter((t) => t.category === category);

  return { templates: filtered, isLoading };
}
