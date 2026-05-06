import { renderAsHtml } from '@bahmni/services';
import type { RenderRequest } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

function getCurrentLocale(): string {
  return localStorage.getItem('BAHMNI_LOCALE_STORAGE_KEY') ?? 'en';
}

interface UsePrintDocumentOptions {
  templateId: string;
  context: Record<string, string>;
}

interface UsePrintDocumentResult {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  htmlContent: string | null | undefined;
  isLoadingHtml: boolean;
  htmlError: string | null;
}

export function usePrintDocument({
  templateId,
  context,
}: UsePrintDocumentOptions): UsePrintDocumentResult {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const locale = getCurrentLocale();

  const renderRequest: RenderRequest = {
    templateId,
    format: 'html',
    locale,
    context,
  };

  const {
    data: htmlContent,
    isLoading: isLoadingHtml,
    error: htmlError,
  } = useQuery({
    queryKey: ['renderTemplate', templateId, 'html', context, locale],
    queryFn: () => renderAsHtml(renderRequest),
    enabled: isModalOpen,
    staleTime: 0,
    gcTime: 0,
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return {
    isModalOpen,
    openModal,
    closeModal,
    htmlContent: htmlContent ?? null,
    isLoadingHtml,
    htmlError: htmlError ? String(htmlError) : null,
  };
}
