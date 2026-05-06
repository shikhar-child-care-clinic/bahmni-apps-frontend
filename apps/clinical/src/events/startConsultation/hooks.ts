import { useEffect } from 'react';
import { CONSULTATION_START_EVENT } from './constants';
import { ConsultationStartEventPayload } from './models';

export const useSubscribeConsultationStart = (
  callback: (payload: ConsultationStartEventPayload) => void,
) => {
  useEffect(() => {
    const handler = (event: Event) =>
      callback((event as CustomEvent<ConsultationStartEventPayload>).detail);

    globalThis.addEventListener(CONSULTATION_START_EVENT, handler);
    return () =>
      globalThis.removeEventListener(CONSULTATION_START_EVENT, handler);
  }, [callback]);
};
