import { getFormattedError, ObservationForm } from '@bahmni/services';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadPinnedForms,
  savePinnedForms,
} from '../services/pinnedFormsService';
import useObservationFormsSearch from './useObservationFormsSearch';

interface UsePinnedObservationFormsOptions {
  /** User UUID required for loading and saving pinned forms */
  userUuid?: string | null;
}

export function usePinnedObservationForms(
  options?: UsePinnedObservationFormsOptions,
) {
  const { userUuid } = options ?? {};
  const { forms: availableForms, isLoading: isFormsLoading } =
    useObservationFormsSearch('');
  const [pinnedForms, setPinnedForms] = useState<ObservationForm[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const availableFormsRef = useRef<ObservationForm[]>([]);

  // Keep ref updated with latest forms
  useEffect(() => {
    availableFormsRef.current = availableForms;
  }, [availableForms]);

  // Load pinned forms on mount - single source of truth
  // Only runs ONCE when forms finish loading
  useEffect(() => {
    const loadPinnedFormsData = async () => {
      if (!userUuid) {
        setIsInitialLoadComplete(true);
        return;
      }

      setError(null);
      try {
        const names = await loadPinnedForms(userUuid);
        const currentForms = availableFormsRef.current;
        if (names.length > 0 && currentForms.length > 0) {
          const matchedForms = currentForms.filter((form) =>
            names.includes(form.name),
          );
          setPinnedForms(matchedForms);
        } else {
          setPinnedForms([]);
        }
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(formattedError);
        setPinnedForms([]);
      } finally {
        setIsInitialLoadComplete(true);
      }
    };

    // Only load ONCE when forms finish loading 
    if (!isFormsLoading && !isInitialLoadComplete && userUuid) {
      loadPinnedFormsData();
    }
  }, [isFormsLoading, isInitialLoadComplete, userUuid]);

  const updatePinnedForms = useCallback(
    async (newPinnedForms: ObservationForm[]) => {
      if (!userUuid) {
        return;
      }

      // Update local state immediately (optimistic UI)
      setPinnedForms(newPinnedForms);
      try {
        // Save to backend asynchronously
        await savePinnedForms(userUuid, newPinnedForms.map((f) => f.name));
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(formattedError);
        // Could optionally revert the optimistic update here on error
      }
    },
    [userUuid],
  );

  const isLoading = isFormsLoading || !isInitialLoadComplete;

  return { pinnedForms, updatePinnedForms, isLoading, error };
}
