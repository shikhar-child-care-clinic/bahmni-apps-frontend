import { getTemplates } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useDocumentTemplatesForCategory } from '../useDocumentTemplates';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getTemplates: jest.fn(),
}));

const mockGetTemplates = getTemplates as jest.MockedFunction<
  typeof getTemplates
>;

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
});

describe('useDocumentTemplatesForCategory', () => {
  it('returns templates matching the given category', async () => {
    mockGetTemplates.mockResolvedValueOnce({
      templates: [
        {
          id: 'REG_CARD_V1',
          name: 'Registration Card',
          category: 'patientRegistration',
          triggers: [{ label: 'Print Card' }],
          outputFormats: ['html'],
        },
        {
          id: 'MED_PRINT_V1',
          name: 'Medication Print',
          category: 'medications',
          triggers: [{ label: 'Print Medications' }],
          outputFormats: ['html'],
        },
      ],
    });

    const { result } = renderHook(
      () => useDocumentTemplatesForCategory('patientRegistration'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].id).toBe('REG_CARD_V1');
  });

  it('returns empty array when no templates match the category', async () => {
    mockGetTemplates.mockResolvedValueOnce({ templates: [] });

    const { result } = renderHook(
      () => useDocumentTemplatesForCategory('unknownCategory'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.templates).toHaveLength(0);
  });

  it('returns empty array when getTemplates fails', async () => {
    mockGetTemplates.mockRejectedValueOnce(new Error('Service unavailable'));

    const { result } = renderHook(
      () => useDocumentTemplatesForCategory('patientRegistration'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.templates).toHaveLength(0);
  });
});
