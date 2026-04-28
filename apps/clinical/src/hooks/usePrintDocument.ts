import { renderAsHtml, renderAsPdf } from '@bahmni/services';
import type { RenderRequest } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

function getCurrentLocale(): string {
  return localStorage.getItem('BAHMNI_LOCALE_STORAGE_KEY') ?? 'en';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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
  isDownloadingPdf: boolean;
  downloadPdf: () => Promise<void>;
}

/**
 * Manages the complete lifecycle of a print action:
 *   1. User clicks a print trigger button → openModal()
 *   2. Modal opens → HTML is fetched from the template service
 *   3. HTML displayed in <iframe> inside PrintModal
 *   4. User clicks Print → PrintModal calls window.print() on the iframe
 *   5. User clicks Download PDF → downloadPdf() fetches PDF blob, triggers download
 *   6. User clicks Cancel → closeModal()
 *
 * HTML is only fetched when the modal is open (enabled: isModalOpen).
 * staleTime/gcTime = 0 ensures each open always fetches fresh clinical data.
 */
export function usePrintDocument({
  templateId,
  context,
}: UsePrintDocumentOptions): UsePrintDocumentResult {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

  const downloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await renderAsPdf({ ...renderRequest, format: 'pdf' });
      downloadBlob(blob, `${templateId}.pdf`);
    } catch {
      // PDF download failed — isDownloadingPdf resets in finally
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    htmlContent: htmlContent ?? null,
    isLoadingHtml,
    htmlError: htmlError ? String(htmlError) : null,
    isDownloadingPdf,
    downloadPdf,
  };
}
