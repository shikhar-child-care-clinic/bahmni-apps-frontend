import { FormMetadata } from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as bahmniServices from '@bahmni/services';
import { useObservationFormMetadata } from '../useObservationFormMetadata';
import React from 'react';

// Mock the fetchFormMetadata function
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchFormMetadata: jest.fn(),
}));

const mockFetchFormMetadata = bahmniServices.fetchFormMetadata as jest.MockedFunction<
  typeof bahmniServices.fetchFormMetadata
>;

describe('useObservationFormMetadata', () => {
  let queryClient: QueryClient;

  const mockFormMetadata: FormMetadata = {
    uuid: 'form-uuid',
    name: 'Test Form',
    version: '1.0',
    published: true,
    schema: undefined,
  };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity, // Prevent background refetches in tests
          gcTime: Infinity, // Garbage collection time (formerly cacheTime)
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe('Query Execution', () => {
    it('should fetch form metadata when formUuid is provided', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFormMetadata);
      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid');
      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when formUuid is undefined', async () => {
      const { result } = renderHook(() => useObservationFormMetadata(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    });

    it('should not fetch when formUuid is empty string', async () => {
      const { result } = renderHook(() => useObservationFormMetadata(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching', async () => {
      mockFetchFormMetadata.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFormMetadata), 100)),
      );

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it('should transition from loading to success', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockFormMetadata);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch form metadata');
      mockFetchFormMetadata.mockRejectedValue(error);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetchFormMetadata.mockRejectedValue(networkError);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(networkError);
    });
  });

  describe('Query Caching', () => {
    it('should cache the result for the same formUuid', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result: result1 } = renderHook(
        () => useObservationFormMetadata('form-uuid'),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);

      // Second render with same formUuid should use cache
      const { result: result2 } = renderHook(
        () => useObservationFormMetadata('form-uuid'),
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          ),
        },
      );

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should still only have been called once (using cache)
      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);
      expect(result2.current.data).toEqual(mockFormMetadata);
    });

    it('should fetch separately for different formUuids', async () => {
      const mockFormMetadata2: FormMetadata = {
        uuid: 'form-uuid-2',
        name: 'Test Form 2',
        version: '2.0',
        published: true,
        schema: undefined,
      };

      mockFetchFormMetadata
        .mockResolvedValueOnce(mockFormMetadata)
        .mockResolvedValueOnce(mockFormMetadata2);

      const { result: result1 } = renderHook(
        () => useObservationFormMetadata('form-uuid'),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockFormMetadata);
      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid');

      const { result: result2 } = renderHook(
        () => useObservationFormMetadata('form-uuid-2'),
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          ),
        },
      );

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result2.current.data).toEqual(mockFormMetadata2);
      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid-2');
      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query Key', () => {
    it('should use correct query key format', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the query exists in the cache with the correct key
      const cachedData = queryClient.getQueryData(['formMetadata', 'form-uuid']);
      expect(cachedData).toEqual(mockFormMetadata);
    });

    it('should have different cache entries for different formUuids', async () => {
      const mockFormMetadata2: FormMetadata = {
        uuid: 'form-uuid-2',
        name: 'Test Form 2',
        version: '2.0',
        published: true,
        schema: undefined,
      };

      mockFetchFormMetadata
        .mockResolvedValueOnce(mockFormMetadata)
        .mockResolvedValueOnce(mockFormMetadata2);

      renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      renderHook(() => useObservationFormMetadata('form-uuid-2'), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      await waitFor(() => {
        expect(queryClient.getQueryData(['formMetadata', 'form-uuid'])).toBeDefined();
        expect(queryClient.getQueryData(['formMetadata', 'form-uuid-2'])).toBeDefined();
      });

      expect(queryClient.getQueryData(['formMetadata', 'form-uuid'])).toEqual(
        mockFormMetadata,
      );
      expect(queryClient.getQueryData(['formMetadata', 'form-uuid-2'])).toEqual(
        mockFormMetadata2,
      );
    });
  });

  describe('Query Enabling', () => {
    it('should be enabled when formUuid is provided', () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(mockFetchFormMetadata).toHaveBeenCalled();
    });

    it('should be disabled when formUuid is undefined', () => {
      const { result } = renderHook(() => useObservationFormMetadata(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    });

    it('should enable query when formUuid changes from undefined to defined', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result, rerender } = renderHook(
        ({ uuid }) => useObservationFormMetadata(uuid),
        {
          wrapper: createWrapper(),
          initialProps: { uuid: undefined as string | undefined },
        },
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();

      rerender({ uuid: 'form-uuid' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid');
      expect(result.current.data).toEqual(mockFormMetadata);
    });

    it('should refetch when formUuid changes', async () => {
      const mockFormMetadata2: FormMetadata = {
        uuid: 'form-uuid-2',
        name: 'Test Form 2',
        version: '2.0',
        published: true,
        schema: undefined,
      };

      mockFetchFormMetadata
        .mockResolvedValueOnce(mockFormMetadata)
        .mockResolvedValueOnce(mockFormMetadata2);

      const { result, rerender } = renderHook(
        ({ uuid }) => useObservationFormMetadata(uuid),
        {
          wrapper: createWrapper(),
          initialProps: { uuid: 'form-uuid' as string | undefined },
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFormMetadata);

      rerender({ uuid: 'form-uuid-2' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockFormMetadata2);
      });

      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(2);
      expect(mockFetchFormMetadata).toHaveBeenNthCalledWith(1, 'form-uuid');
      expect(mockFetchFormMetadata).toHaveBeenNthCalledWith(2, 'form-uuid-2');
    });
  });

  describe('Return Value Structure', () => {
    it('should return standard React Query result properties', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should allow manual refetch', async () => {
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const { result } = renderHook(() => useObservationFormMetadata('form-uuid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(1);

      // Manual refetch
      await result.current.refetch();

      expect(mockFetchFormMetadata).toHaveBeenCalledTimes(2);
    });
  });
});
