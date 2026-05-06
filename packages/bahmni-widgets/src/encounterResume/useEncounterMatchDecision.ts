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

export interface UseEncounterMatchDecisionParams {
  patientUuid: string | null | undefined;
  visitUuid: string | null | undefined;
  providerUuid?: string | null | undefined;
  locationUuid: string | null | undefined;
}

export interface UseEncounterMatchDecisionResult {
  status: EncounterMatchStatus | null;
  encounterUuid: string | null;
  reason: string | null;
  /** True when backend returns match_found — caller should resume existing encounter. */
  canResume: boolean;
  /** True when backend returns match_found OR no_match — show Edit button. */
  showEditButton: boolean;
  /** False when status is no_active_visit or error — hide the button entirely. */
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

/**
 * Hook that calls the backend match-decision API to determine whether an existing
 * encounter can be resumed or a new one must be created.
 *
 * Returns derived UI flags:
 * - `canResume`       — true only when backend says `match_found`
 * - `showEditButton`  — true for `match_found` or `no_match` (show button, behaviour differs)
 * - `shouldShowButton`— false for `no_active_visit` or `error` (hide button entirely)
 */
export function useEncounterMatchDecision(
  params: UseEncounterMatchDecisionParams,
): UseEncounterMatchDecisionResult {
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
    queryFn: () => {
      if (!patientUuid || !locationUuid) {
        return Promise.reject(
          new Error('patientUuid and locationUuid are required'),
        );
      }
      return fetchEncounterMatchDecision({
        patientUuid,
        visitUuid: visitUuid ?? undefined,
        locationUuid,
        ...(providerUuid ? { providerUuid } : {}),
      });
    },
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
