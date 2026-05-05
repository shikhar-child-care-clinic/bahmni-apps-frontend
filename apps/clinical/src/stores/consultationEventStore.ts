import { Resource } from 'fhir/r4';
import { create } from 'zustand';

interface ConsultationEventState {
  fhirResource: Resource | undefined;
  setFhirResource: (resource: Resource | undefined) => void;
  reset: () => void;
}

const useConsultationEventStore = create<ConsultationEventState>((set) => ({
  fhirResource: undefined,
  setFhirResource: (resource) => set({ fhirResource: resource }),
  reset: () => set({ fhirResource: undefined }),
}));

export default useConsultationEventStore;
