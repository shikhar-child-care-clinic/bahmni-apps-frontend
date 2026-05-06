import { renderAsHtml, getUserPreferredLocale } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { usePrintDocument } from '../usePrintDocument';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  renderAsHtml: jest.fn(),
  getUserPreferredLocale: jest.fn(() => 'en'),
}));

const mockRenderAsHtml = renderAsHtml as jest.MockedFunction<
  typeof renderAsHtml
>;
const mockGetUserPreferredLocale =
  getUserPreferredLocale as jest.MockedFunction<typeof getUserPreferredLocale>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserPreferredLocale.mockReturnValue('en');
});

describe('usePrintDocument', () => {
  const options = {
    templateId: 'REG_CARD_V1',
    context: { patientUuid: 'patient-uuid-123' },
  };

  it('starts with modal closed and no content', () => {
    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.htmlContent).toBeNull();
    expect(result.current.isLoadingHtml).toBe(false);
  });

  it('does not fetch HTML until modal is opened', () => {
    renderHook(() => usePrintDocument(options), { wrapper: createWrapper() });

    expect(mockRenderAsHtml).not.toHaveBeenCalled();
  });

  it('fetches HTML when modal is opened', async () => {
    const mockHtml = '<html><body>Card</body></html>';
    mockRenderAsHtml.mockResolvedValueOnce(mockHtml);

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openModal();
    });

    expect(result.current.isModalOpen).toBe(true);

    await waitFor(() => expect(result.current.isLoadingHtml).toBe(false));

    expect(mockRenderAsHtml).toHaveBeenCalledWith({
      templateId: 'REG_CARD_V1',
      format: 'html',
      locale: 'en',
      context: { patientUuid: 'patient-uuid-123' },
    });
    expect(result.current.htmlContent).toBe(mockHtml);
    expect(result.current.htmlError).toBeNull();
  });

  it('sets htmlError when fetch fails', async () => {
    mockRenderAsHtml.mockRejectedValueOnce(new Error('Template not found'));

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openModal();
    });

    await waitFor(() => expect(result.current.isLoadingHtml).toBe(false));

    expect(result.current.htmlContent).toBeNull();
    expect(result.current.htmlError).toBe('Error: Template not found');
  });

  it('closes modal when closeModal is called', () => {
    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openModal();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('uses locale from getUserPreferredLocale', async () => {
    mockGetUserPreferredLocale.mockReturnValue('es');
    mockRenderAsHtml.mockResolvedValueOnce('<html/>');

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openModal();
    });

    await waitFor(() => expect(result.current.isLoadingHtml).toBe(false));

    expect(mockRenderAsHtml).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'es' }),
    );
  });
});
