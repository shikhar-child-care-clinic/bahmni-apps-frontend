import { renderAsHtml, getUserPreferredLocale } from '@bahmni/services';
import type { RenderRequest } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface UsePrintDocumentOptions {
  templateId: string;
  context: Record<string, string>;
}

interface UsePrintDocumentResult {
  isPrinting: boolean;
  triggerPrint: () => void;
  printError: string | null;
}

export function usePrintDocument({
  templateId,
  context,
}: UsePrintDocumentOptions): UsePrintDocumentResult {
  const [triggered, setTriggered] = useState(false);

  const locale = getUserPreferredLocale();

  const renderRequest: RenderRequest = {
    templateId,
    format: 'html',
    locale,
    context,
  };

  const {
    data: htmlContent,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['renderTemplate', templateId, 'html', context, locale],
    queryFn: () => renderAsHtml(renderRequest),
    enabled: triggered,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (!triggered || isLoading || !htmlContent) return;

    const iframe = document.createElement('iframe');
    // Full-size but invisible: opacity:0 lets Chrome load sub-resources (images/CSS).
    // width:0 or height:0 causes Chrome to skip loading images in hidden iframes.
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'border:none;opacity:0;pointer-events:none;z-index:-1;';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;

    const teardown = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      setTriggered(false);
    };

    if (!iframeDoc || !iframe.contentWindow) {
      teardown();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    const doPrint = () => {
      iframe.contentWindow?.print();
      teardown();
    };

    // Wait for every image to settle (load or error) before printing.
    // img.complete is true once the browser has finished fetching (success or fail).
    const images = Array.from(
      iframeDoc.querySelectorAll('img'),
    ) as HTMLImageElement[];
    const pending = images.filter((img) => !img.complete);

    if (pending.length === 0) {
      doPrint();
      return;
    }

    let remaining = pending.length;
    const onSettled = () => {
      remaining -= 1;
      if (remaining === 0) doPrint();
    };

    pending.forEach((img) => {
      img.addEventListener('load', onSettled, { once: true });
      img.addEventListener('error', onSettled, { once: true });
    });

    return () => {
      pending.forEach((img) => {
        img.removeEventListener('load', onSettled);
        img.removeEventListener('error', onSettled);
      });
      teardown();
    };
  }, [triggered, isLoading, htmlContent]);

  useEffect(() => {
    if (queryError) setTriggered(false);
  }, [queryError]);

  return {
    isPrinting: triggered,
    triggerPrint: () => setTriggered(true),
    printError: queryError ? String(queryError) : null,
  };
}
