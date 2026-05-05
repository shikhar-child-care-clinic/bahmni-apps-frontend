import { Resource } from 'fhir/r4';

export interface ConsultationStartEvent {
  encounterType?: string;
  resource?: Resource;
}
