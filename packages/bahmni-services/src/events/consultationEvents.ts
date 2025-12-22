import { useEffect, useCallback, useRef } from 'react';

/**
 * Consultation Events using Window CustomEvents
 * Alternative approach to EventEmitter class for comparison
 *
 * MEMORY LEAK PREVENTION:
 * - useConsultationSavedEvent hook ensures proper cleanup via useEffect return
 * - Event listeners are removed on component unmount
 * - Callback is memoized to prevent unnecessary re-subscriptions
 */

// Event name
export const CONSULTATION_SAVED_EVENT = 'consultation:saved';

// Event payload interface
export interface ConsultationSavedEventPayload {
  patientUUID: string;
  updatedResources: {
    conditions: boolean;
    allergies: boolean;
  };
}

/**
 * Dispatch consultation saved event using window.dispatchEvent
 * @param payload - The consultation saved event data
 */
export const dispatchConsultationSaved = (
  payload: ConsultationSavedEventPayload,
): void => {
  const event = new CustomEvent(CONSULTATION_SAVED_EVENT, {
    detail: payload,
  });
  window.dispatchEvent(event);
};

/**
 * React hook for subscribing to consultation saved events
 *
 * MEMORY LEAK PREVENTION:
 * - Automatically removes event listener on component unmount
 * - Uses useRef to maintain stable callback reference
 * - Cleanup function ensures listener is always removed
 *
 * USAGE:
 * ```typescript
 * useConsultationSavedEvent((payload) => {
 *   if (payload.patientUUID === currentPatient && payload.updatedResources.conditions) {
 *     refetch();
 *   }
 * }, [currentPatient, refetch]);
 * ```
 *
 * @param callback - Function to call when event is published
 * @param deps - Dependencies array (should include values used in callback)
 */
export const useConsultationSavedEvent = (
  callback: (payload: ConsultationSavedEventPayload) => void,
  deps: React.DependencyList = [],
) => {
  // Use ref to store the latest callback without triggering re-subscription
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Create stable handler that uses the ref
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ConsultationSavedEventPayload>;
      // Always use the latest callback from ref
      callbackRef.current(customEvent.detail);
    };

    // Add listener
    window.addEventListener(CONSULTATION_SAVED_EVENT, handler);

    // CRITICAL: Cleanup function removes listener to prevent memory leaks
    return () => {
      window.removeEventListener(CONSULTATION_SAVED_EVENT, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps); // Only re-subscribe when deps change
};
