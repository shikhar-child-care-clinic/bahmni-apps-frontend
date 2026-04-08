import {
  type PatientSearchResult,
  type PatientSearchResultBundle,
  searchPatientByNameOrId,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

interface UsePatientSearchResult {
  results: PatientSearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

const isPatientSearchResult = (
  result: PatientSearchResult | { appointmentNumber?: string },
): result is PatientSearchResult => {
  return !('appointmentNumber' in result);
};

const usePatientSearch = (searchTerm: string): UsePatientSearchResult => {
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
  } = useQuery<PatientSearchResultBundle>({
    queryKey: ['patientSearch', searchTerm],
    queryFn: () => searchPatientByNameOrId(searchTerm),
    enabled: searchTerm.trim().length > 0,
  });

  const results = (searchResults?.pageOfResults ?? [])
    .filter(isPatientSearchResult)
    .filter(
      (patient) =>
        patient.identifier.toLowerCase() === searchTerm.toLowerCase(),
    );

  return { results, isLoading, isError, error: error as Error | null };
};

export default usePatientSearch;
