import { post } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

const ENCOUNTER_MATCH_DECISION_URL =
  '/openmrs/ws/rest/v1/bahmnicore/bahmniencounter/match-decision';

export type EncounterMatchStatus =
  | 'match_found'
  | 'no_match'
  | 'no_active_visit'
  | 'error';

export type NoMatchReason =
  | 'provider_mismatch'
  | 'location_mismatch'
  | 'session_expired';

export interface EncounterMatchDecisionRequest {
  patientUuid: string;
  providerUuid?: string;
  locationUuid: string;
  visitUuid?: string;
  encounterDateTime?: string;
  patientProgramUuid?: string;
  includeAll?: boolean;
}

export interface EncounterMatchDecisionResponse {
  status: EncounterMatchStatus;
  encounterUuid?: string;
  reason?: NoMatchReason | string;
  matchDetails?: Record<string, unknown>;
}

export interface EncounterMatchDecisionParams {
  patientUuid: string | null | undefined;
  visitUuid: string | null | undefined;
  providerUuid?: string | null | undefined;
  locationUuid: string | null | undefined;
}

export interface EncounterMatchDecisionResult {
  status: EncounterMatchStatus | null;
  encounterUuid: string | null;
  reason: string | null;
  canResume: boolean;
  showEditButton: boolean;
  shouldShowButton: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchEncounterMatchDecision(
  params: EncounterMatchDecisionRequest,
): Promise<EncounterMatchDecisionResponse> {
  return post<EncounterMatchDecisionResponse, EncounterMatchDecisionRequest>(
    ENCOUNTER_MATCH_DECISION_URL,
    params,
  );
}

export function useEncounterMatchDecision(
  params: EncounterMatchDecisionParams,
): EncounterMatchDecisionResult {
  const { patientUuid, visitUuid, providerUuid, locationUuid } = params;

  const isEnabled = !!(patientUuid && locationUuid);

  const { data, isLoading, error, refetch } = useQuery<
    EncounterMatchDecisionResponse | null,
    Error
  >({
    queryKey: [
      'encounterMatchDecision',
      patientUuid,
      visitUuid,
      providerUuid,
      locationUuid,
    ],
    enabled: isEnabled,
    retry: false,
    queryFn: () =>
      fetchEncounterMatchDecision({
        patientUuid,
        visitUuid: visitUuid ?? undefined,
        locationUuid,
        ...(providerUuid ? { providerUuid } : {}),
      }),
  });

  if (!isEnabled) {
    return {
      status: null,
      encounterUuid: null,
      reason: null,
      canResume: false,
      showEditButton: false,
      shouldShowButton: false,
      isLoading: false,
      error: null,
      refetch: () => undefined,
    };
  }

  if (isLoading) {
    return {
      status: null,
      encounterUuid: null,
      reason: null,
      canResume: false,
      showEditButton: false,
      shouldShowButton: false,
      isLoading: true,
      error: null,
      refetch,
    };
  }

  if (error) {
    return {
      status: 'error',
      encounterUuid: null,
      reason: null,
      canResume: false,
      showEditButton: false,
      shouldShowButton: false,
      isLoading: false,
      error,
      refetch,
    };
  }

  const status = data?.status ?? null;
  const encounterUuid = data?.encounterUuid ?? null;
  const reason = data?.reason ?? null;

  const canResume = status === 'match_found';
  const showEditButton = status === 'match_found' || status === 'no_match';
  const shouldShowButton =
    status !== null && status !== 'no_active_visit' && status !== 'error';

  return {
    status,
    encounterUuid,
    reason,
    canResume,
    showEditButton,
    shouldShowButton,
    isLoading: false,
    error: null,
    refetch,
  };
}
