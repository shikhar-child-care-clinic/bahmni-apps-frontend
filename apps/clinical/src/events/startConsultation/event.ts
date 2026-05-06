import { CONSULTATION_START_EVENT } from './constants';
import { ConsultationStartEventPayload } from './models';

export const dispatchConsultationStart = (
  payload: ConsultationStartEventPayload,
): void => {
  const event = new CustomEvent(CONSULTATION_START_EVENT, {
    detail: payload,
  });
  globalThis.dispatchEvent(event);
};
