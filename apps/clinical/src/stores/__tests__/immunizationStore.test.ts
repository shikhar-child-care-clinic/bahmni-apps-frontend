import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useImmunizationStore } from '../immunizationStore';
import { ImmunizationFormConfig } from '../../providers/clinicalConfig/models';

let uuidCounter = 0;
beforeAll(() => {
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
    configurable: true,
  });
});

const VACCINE_UUID = 'vaccine-uuid';
const VACCINE_DISPLAY = 'BCG Vaccine';

describe('useImmunizationStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useImmunizationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initialization', () => {
    it('should initialize with empty selectedImmunizations', () => {
      const { result } = renderHook(() => useImmunizationStore());
      expect(result.current.selectedImmunizations).toEqual([]);
    });
  });

  describe('addImmunization', () => {
    it('should add a new immunization with default values', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => {
        result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration');
      });

      expect(result.current.selectedImmunizations).toHaveLength(1);
      const entry = result.current.selectedImmunizations[0];
      expect(entry.vaccineConceptUuid).toBe(VACCINE_UUID);
      expect(entry.vaccineDisplay).toBe(VACCINE_DISPLAY);
      expect(entry.mode).toBe('administration');
      expect(entry.status).toBe('completed');
      expect(entry.errors).toEqual({});
      expect(entry.hasBeenValidated).toBe(false);
    });

    it('should set status to not-done for not-done mode', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => {
        result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'not-done');
      });

      expect(result.current.selectedImmunizations[0].status).toBe('not-done');
    });

    it('should prepend new immunizations (newest first)', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => {
        result.current.addImmunization('uuid-1', 'Vaccine 1', 'history');
        result.current.addImmunization('uuid-2', 'Vaccine 2', 'administration');
      });

      expect(result.current.selectedImmunizations).toHaveLength(2);
      expect(result.current.selectedImmunizations[0].vaccineConceptUuid).toBe('uuid-2');
      expect(result.current.selectedImmunizations[1].vaccineConceptUuid).toBe('uuid-1');
    });
  });

  describe('removeImmunization', () => {
    it('should remove the immunization with the given id', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => {
        result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history');
      });

      const id = result.current.selectedImmunizations[0].id;

      act(() => {
        result.current.removeImmunization(id);
      });

      expect(result.current.selectedImmunizations).toHaveLength(0);
    });

    it('should only remove the specified immunization', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => {
        result.current.addImmunization('uuid-1', 'Vaccine 1', 'history');
        result.current.addImmunization('uuid-2', 'Vaccine 2', 'history');
      });

      const idToRemove = result.current.selectedImmunizations[1].id;

      act(() => {
        result.current.removeImmunization(idToRemove);
      });

      expect(result.current.selectedImmunizations).toHaveLength(1);
      expect(result.current.selectedImmunizations[0].vaccineConceptUuid).toBe('uuid-2');
    });
  });

  describe('update actions', () => {
    it('updateDoseSequence should update doseSequence', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateDoseSequence(id, 3));

      expect(result.current.selectedImmunizations[0].doseSequence).toBe(3);
    });

    it('updateDrug should set drugUuid and drugDisplay, clear drugNonCoded', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateDrug(id, 'drug-uuid', 'BCG Drug'));

      const entry = result.current.selectedImmunizations[0];
      expect(entry.drugUuid).toBe('drug-uuid');
      expect(entry.drugDisplay).toBe('BCG Drug');
      expect(entry.drugNonCoded).toBe('');
    });

    it('updateDrugNonCoded should set drugNonCoded and clear drugUuid', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => {
        result.current.updateDrug(id, 'drug-uuid', 'BCG Drug');
        result.current.updateDrugNonCoded(id, 'Generic Vaccine');
      });

      const entry = result.current.selectedImmunizations[0];
      expect(entry.drugNonCoded).toBe('Generic Vaccine');
      expect(entry.drugUuid).toBeNull();
      expect(entry.drugDisplay).toBeNull();
    });

    it('updateAdministeredOn should update administeredOn date', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;
      const date = new Date('2024-03-10');

      act(() => result.current.updateAdministeredOn(id, date));

      expect(result.current.selectedImmunizations[0].administeredOn).toBe(date);
    });

    it('updateLocation should set locationUuid and display, clear locationText', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateLocation(id, 'loc-uuid', 'Main Clinic'));

      const entry = result.current.selectedImmunizations[0];
      expect(entry.locationUuid).toBe('loc-uuid');
      expect(entry.locationDisplay).toBe('Main Clinic');
      expect(entry.locationText).toBe('');
    });

    it('updateLocationText should set locationText and clear locationUuid', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => {
        result.current.updateLocation(id, 'loc-uuid', 'Main Clinic');
        result.current.updateLocationText(id, 'City Clinic');
      });

      const entry = result.current.selectedImmunizations[0];
      expect(entry.locationText).toBe('City Clinic');
      expect(entry.locationUuid).toBeNull();
      expect(entry.locationDisplay).toBeNull();
    });

    it('updateRoute should set routeConceptUuid and routeDisplay', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateRoute(id, 'route-uuid', 'Intramuscular'));

      expect(result.current.selectedImmunizations[0].routeConceptUuid).toBe('route-uuid');
      expect(result.current.selectedImmunizations[0].routeDisplay).toBe('Intramuscular');
    });

    it('updateSite should set siteConceptUuid and siteDisplay', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateSite(id, 'site-uuid', 'Left arm'));

      expect(result.current.selectedImmunizations[0].siteConceptUuid).toBe('site-uuid');
      expect(result.current.selectedImmunizations[0].siteDisplay).toBe('Left arm');
    });

    it('updateManufacturer should update manufacturer', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateManufacturer(id, 'Pfizer'));

      expect(result.current.selectedImmunizations[0].manufacturer).toBe('Pfizer');
    });

    it('updateBatchNumber should update batchNumber', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateBatchNumber(id, 'BATCH-001'));

      expect(result.current.selectedImmunizations[0].batchNumber).toBe('BATCH-001');
    });

    it('updateExpirationDate should update expirationDate', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;
      const date = new Date('2025-12-31');

      act(() => result.current.updateExpirationDate(id, date));

      expect(result.current.selectedImmunizations[0].expirationDate).toBe(date);
    });

    it('updateNotes should update notes', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateNotes(id, 'No adverse effects'));

      expect(result.current.selectedImmunizations[0].notes).toBe('No adverse effects');
    });

    it('updateStatus should update status', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateStatus(id, 'not-done'));

      expect(result.current.selectedImmunizations[0].status).toBe('not-done');
    });

    it('updateStatusReason should set statusReasonConceptUuid and display', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'not-done'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateStatusReason(id, 'reason-uuid', 'Patient refused'));

      expect(result.current.selectedImmunizations[0].statusReasonConceptUuid).toBe('reason-uuid');
      expect(result.current.selectedImmunizations[0].statusReasonDisplay).toBe('Patient refused');
    });

    it('updateOrderUuid should update orderUuid', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateOrderUuid(id, 'order-uuid'));

      expect(result.current.selectedImmunizations[0].orderUuid).toBe('order-uuid');
    });
  });

  describe('error clearing on update after validation', () => {
    it('should clear the field error when a required field is updated after validation', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.validateAll());

      expect(result.current.selectedImmunizations[0].errors.administeredOn).toBeDefined();

      act(() => result.current.updateAdministeredOn(id, new Date('2024-01-01')));

      expect(result.current.selectedImmunizations[0].errors.administeredOn).toBeUndefined();
    });

    it('should not clear errors on update before validation has occurred', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateNotes(id, 'some note'));

      expect(result.current.selectedImmunizations[0].errors).toEqual({});
    });
  });

  describe('validateAll', () => {
    it('should return false and set errors when required fields are missing (administration mode)', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'administration'));

      let isValid = true;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      const errors = result.current.selectedImmunizations[0].errors;
      expect(errors.administeredOn).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.drug).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.batchNumber).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.expirationDate).toBe('INPUT_VALUE_REQUIRED');
      expect(result.current.selectedImmunizations[0].hasBeenValidated).toBe(true);
    });

    it('should return false and set statusReason error for not-done mode', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'not-done'));

      let isValid = true;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedImmunizations[0].errors.statusReason).toBe(
        'DROPDOWN_VALUE_REQUIRED',
      );
    });

    it('should return false and set administeredOn error for history mode', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history'));

      let isValid = true;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedImmunizations[0].errors.administeredOn).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });

    it('should return true when all required fields are filled for history mode', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history'));
      const id = result.current.selectedImmunizations[0].id;

      act(() => result.current.updateAdministeredOn(id, new Date('2024-01-01')));

      let isValid = false;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(true);
      expect(result.current.selectedImmunizations[0].errors).toEqual({});
    });

    it('should return false when administeredOn is a future date', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history'));
      const id = result.current.selectedImmunizations[0].id;

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      act(() => result.current.updateAdministeredOn(id, futureDate));

      let isValid = true;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedImmunizations[0].errors.administeredOn).toBe(
        'IMMUNIZATION_DATE_FUTURE_ERROR',
      );
    });

    it('should use custom fieldConfig overrides when immunizationConfig is provided', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history'));
      const id = result.current.selectedImmunizations[0].id;

      const config: ImmunizationFormConfig = {
        vaccineConceptSetUuid: 'vaccine-set-uuid',
        routeConceptSetUuid: 'route-set-uuid',
        siteConceptSetUuid: 'site-set-uuid',
        notDoneStatusReasonConceptSetUuid: 'status-reason-set-uuid',
        history: {
          fieldConfig: {
            administeredOn: 'visible',
            batchNumber: 'required',
          },
        },
      };

      act(() => result.current.updateAdministeredOn(id, new Date('2024-01-01')));

      let isValid = true;
      act(() => {
        isValid = result.current.validateAll(config);
      });

      expect(isValid).toBe(false);
      expect(result.current.selectedImmunizations[0].errors.batchNumber).toBe(
        'INPUT_VALUE_REQUIRED',
      );
      expect(result.current.selectedImmunizations[0].errors.administeredOn).toBeUndefined();
    });

    it('should validate all entries and return false if any entry is invalid', () => {
      const { result } = renderHook(() => useImmunizationStore());
      act(() => {
        result.current.addImmunization('uuid-1', 'Vaccine 1', 'history');
        result.current.addImmunization('uuid-2', 'Vaccine 2', 'history');
      });

      // After two adds: [uuid-2 (index 0), uuid-1 (index 1)] — newest first
      // Fill date only for index 0 (uuid-2); leave index 1 (uuid-1) without a date
      const idOfFirst = result.current.selectedImmunizations[0].id;
      act(() => result.current.updateAdministeredOn(idOfFirst, new Date('2024-01-01')));

      let isValid = true;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      // index 0 (uuid-2) has date filled — no administeredOn error
      expect(result.current.selectedImmunizations[0].errors.administeredOn).toBeUndefined();
      // index 1 (uuid-1) has no date — should error
      expect(result.current.selectedImmunizations[1].errors.administeredOn).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('reset', () => {
    it('should clear all selected immunizations', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => {
        result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history');
        result.current.addImmunization('uuid-2', 'Vaccine 2', 'administration');
      });

      act(() => result.current.reset());

      expect(result.current.selectedImmunizations).toHaveLength(0);
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      const { result } = renderHook(() => useImmunizationStore());

      act(() => result.current.addImmunization(VACCINE_UUID, VACCINE_DISPLAY, 'history'));

      const state = result.current.getState();
      expect(state.selectedImmunizations).toEqual(result.current.selectedImmunizations);
    });
  });
});
