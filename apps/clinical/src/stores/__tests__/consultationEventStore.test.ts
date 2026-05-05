import { act, renderHook } from '@testing-library/react';
import useConsultationEventStore from '../consultationEventStore';
import { fhirMedicationRequestMock } from './__mocks__/consultationEventStoreMocks';

describe('consultationEventStore', () => {
  beforeEach(() => {
    useConsultationEventStore.getState().reset();
  });

  describe('initial state', () => {
    it('fhirResource is undefined', () => {
      const { result } = renderHook(() => useConsultationEventStore());

      expect(result.current.fhirResource).toBeUndefined();
    });
  });

  describe('setFhirResource', () => {
    it('sets the fhir resource', () => {
      const { result } = renderHook(() => useConsultationEventStore());

      act(() => {
        result.current.setFhirResource(fhirMedicationRequestMock);
      });

      expect(result.current.fhirResource).toEqual(fhirMedicationRequestMock);
    });

    it('overwrites a previously set resource', () => {
      const { result } = renderHook(() => useConsultationEventStore());
      const updatedResource = { ...fhirMedicationRequestMock, id: 'med-req-2' };

      act(() => {
        result.current.setFhirResource(fhirMedicationRequestMock);
      });
      act(() => {
        result.current.setFhirResource(updatedResource);
      });

      expect(result.current.fhirResource).toEqual(updatedResource);
    });

    it.each([
      ['setFhirResource(undefined)', (store: ReturnType<typeof useConsultationEventStore>) => store.setFhirResource(undefined)],
      ['reset()', (store: ReturnType<typeof useConsultationEventStore>) => store.reset()],
    ] as const)('%s clears the fhirResource', (_, clearAction) => {
      const { result } = renderHook(() => useConsultationEventStore());

      act(() => {
        result.current.setFhirResource(fhirMedicationRequestMock);
      });
      expect(result.current.fhirResource).toEqual(fhirMedicationRequestMock);

      act(() => {
        clearAction(result.current);
      });

      expect(result.current.fhirResource).toBeUndefined();
    });
  });
});
