import { post } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useEncounterMatchDecision } from '../useEncounterMatchDecision';
import type { EncounterMatchDecisionResponse } from '../useEncounterMatchDecision';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  post: jest.fn(),
}));

const mockedPost = post as jest.MockedFunction<typeof post>;

const PATIENT_UUID = 'patient-uuid-1';
const VISIT_UUID = 'visit-uuid-1';
const PROVIDER_UUID = 'provider-uuid-1';
const LOCATION_UUID = 'location-uuid-1';
const ENCOUNTER_UUID = 'encounter-uuid-1';

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const defaultParams = {
  patientUuid: PATIENT_UUID,
  visitUuid: VISIT_UUID,
  providerUuid: PROVIDER_UUID,
  locationUuid: LOCATION_UUID,
};

describe('useEncounterMatchDecision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns canResume=true and showEditButton=true when backend returns match_found', async () => {
    const response: EncounterMatchDecisionResponse = {
      status: 'match_found',
      encounterUuid: ENCOUNTER_UUID,
    };
    mockedPost.mockResolvedValue(response);

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canResume).toBe(true);
    expect(result.current.showEditButton).toBe(true);
    expect(result.current.shouldShowButton).toBe(true);
    expect(result.current.status).toBe('match_found');
    expect(result.current.encounterUuid).toBe(ENCOUNTER_UUID);
    expect(result.current.error).toBeNull();
  });

  it('returns canResume=false and showEditButton=true when backend returns no_match with provider_mismatch', async () => {
    const response: EncounterMatchDecisionResponse = {
      status: 'no_match',
      reason: 'provider_mismatch',
    };
    mockedPost.mockResolvedValue(response);

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(true);
    expect(result.current.shouldShowButton).toBe(true);
    expect(result.current.status).toBe('no_match');
    expect(result.current.reason).toBe('provider_mismatch');
    expect(result.current.error).toBeNull();
  });

  it('returns canResume=false and showEditButton=true when backend returns no_match with location_mismatch', async () => {
    const response: EncounterMatchDecisionResponse = {
      status: 'no_match',
      reason: 'location_mismatch',
    };
    mockedPost.mockResolvedValue(response);

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(true);
    expect(result.current.shouldShowButton).toBe(true);
    expect(result.current.status).toBe('no_match');
    expect(result.current.reason).toBe('location_mismatch');
  });

  it('returns canResume=false and showEditButton=false when backend returns no_active_visit', async () => {
    const response: EncounterMatchDecisionResponse = {
      status: 'no_active_visit',
    };
    mockedPost.mockResolvedValue(response);

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(false);
    expect(result.current.shouldShowButton).toBe(false);
    expect(result.current.status).toBe('no_active_visit');
    expect(result.current.error).toBeNull();
  });

  it('returns canResume=false and showEditButton=false when backend returns error status', async () => {
    const response: EncounterMatchDecisionResponse = {
      status: 'error',
    };
    mockedPost.mockResolvedValue(response);

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(false);
    expect(result.current.shouldShowButton).toBe(false);
  });

  it('shows isLoading=true while query is in flight', () => {
    mockedPost.mockImplementation(() => new Promise(() => undefined));

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(false);
  });

  it('returns error state when post throws', async () => {
    const networkError = new Error('Network failure');
    mockedPost.mockRejectedValue(networkError);

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(false);
    expect(result.current.shouldShowButton).toBe(false);
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('returns disabled state when patientUuid is missing', () => {
    const { result } = renderHook(
      () => useEncounterMatchDecision({ ...defaultParams, patientUuid: null }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.canResume).toBe(false);
    expect(result.current.showEditButton).toBe(false);
    expect(result.current.shouldShowButton).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('calls post with visitUuid as undefined when it is missing', async () => {
    mockedPost.mockResolvedValue({ status: 'no_active_visit' });

    const { result } = renderHook(
      () => useEncounterMatchDecision({ ...defaultParams, visitUuid: null }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBe('no_active_visit');
    expect(mockedPost).toHaveBeenCalledWith(
      '/openmrs/ws/rest/v1/bahmnicore/bahmniencounter/match-decision',
      {
        patientUuid: PATIENT_UUID,
        visitUuid: undefined,
        providerUuid: PROVIDER_UUID,
        locationUuid: LOCATION_UUID,
      },
    );
  });

  it('returns disabled state when locationUuid is missing', () => {
    const { result } = renderHook(
      () => useEncounterMatchDecision({ ...defaultParams, locationUuid: null }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.canResume).toBe(false);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('calls post with correct payload including optional providerUuid', async () => {
    mockedPost.mockResolvedValue({
      status: 'match_found',
      encounterUuid: ENCOUNTER_UUID,
    });

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedPost).toHaveBeenCalledWith(
      '/openmrs/ws/rest/v1/bahmnicore/bahmniencounter/match-decision',
      {
        patientUuid: PATIENT_UUID,
        visitUuid: VISIT_UUID,
        providerUuid: PROVIDER_UUID,
        locationUuid: LOCATION_UUID,
      },
    );
  });

  it('calls post without providerUuid when it is not provided', async () => {
    mockedPost.mockResolvedValue({
      status: 'no_match',
      reason: 'session_expired',
    });

    const { result } = renderHook(
      () =>
        useEncounterMatchDecision({
          ...defaultParams,
          providerUuid: undefined,
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedPost).toHaveBeenCalledWith(
      '/openmrs/ws/rest/v1/bahmnicore/bahmniencounter/match-decision',
      {
        patientUuid: PATIENT_UUID,
        visitUuid: VISIT_UUID,
        locationUuid: LOCATION_UUID,
      },
    );
  });

  it('exposes a refetch function that re-calls the API', async () => {
    mockedPost.mockResolvedValue({
      status: 'match_found',
      encounterUuid: ENCOUNTER_UUID,
    });

    const { result } = renderHook(
      () => useEncounterMatchDecision(defaultParams),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callCountBefore = mockedPost.mock.calls.length;

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(mockedPost.mock.calls.length).toBeGreaterThan(callCountBefore),
    );
  });
});
