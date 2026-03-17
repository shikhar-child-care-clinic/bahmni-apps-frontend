import { generateId } from '@bahmni/services';
import { DAYS_OF_WEEK } from '../../constants';
import { useAddServiceStore } from '../addServiceStore';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateId: jest.fn(),
}));

const getStore = () => useAddServiceStore.getState();

const INITIAL_ROW_ID = 'row-1';

describe('addServiceStore', () => {
  let idCounter = 0;

  beforeEach(() => {
    idCounter = 0;
    (generateId as jest.Mock).mockImplementation(() => `row-${++idCounter}`);
    getStore().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state with one row with all days selected', () => {
      const state = getStore();

      expect(state.name).toBe('');
      expect(state.nameError).toBeNull();
      expect(state.description).toBe('');
      expect(state.durationMins).toBeNull();
      expect(state.specialityUuid).toBeNull();
      expect(state.locationUuid).toBeNull();
      expect(state.availabilityRows).toHaveLength(1);
      expect(state.availabilityRows[0].daysOfWeek).toEqual([...DAYS_OF_WEEK]);
    });
  });

  describe('field setters', () => {
    it.each([
      { action: 'setName', field: 'name', value: 'General Consultation' },
      {
        action: 'setDescription',
        field: 'description',
        value: 'A consultation',
      },
      {
        action: 'setSpecialityUuid',
        field: 'specialityUuid',
        value: 'spec-uuid-1',
      },
      { action: 'setLocationUuid', field: 'locationUuid', value: 'loc-uuid-1' },
      { action: 'setDurationMins', field: 'durationMins', value: 30 },
    ])('$action should update $field', ({ action, field, value }) => {
      (getStore() as unknown as Record<string, (v: unknown) => void>)[action](
        value,
      );

      expect((getStore() as unknown as Record<string, unknown>)[field]).toBe(
        value,
      );
    });

    it('setName should clear nameError', () => {
      getStore().validate();
      expect(getStore().nameError).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED',
      );

      getStore().setName('Test Service');

      expect(getStore().nameError).toBeNull();
    });
  });

  describe('addAvailabilityRow', () => {
    it('should add a new row with no days selected', () => {
      getStore().addAvailabilityRow();

      const rows = getStore().availabilityRows;
      expect(rows).toHaveLength(2);
      expect(rows[1].daysOfWeek).toEqual([]);
    });
  });

  describe('removeAvailabilityRow', () => {
    it('should remove row by id', () => {
      getStore().removeAvailabilityRow(INITIAL_ROW_ID);

      expect(getStore().availabilityRows).toHaveLength(0);
    });
  });

  describe('updateAvailabilityRow', () => {
    it.each([
      { field: 'startTime' as const, value: '9:00' },
      { field: 'maxLoad' as const, value: 10 },
    ])('should update $field', ({ field, value }) => {
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, field, value as never);

      expect(getStore().availabilityRows[0][field]).toBe(value);
    });

    it.each([
      {
        field: 'startTime' as const,
        value: '9:00',
        errorField: 'startTime' as const,
      },
      {
        field: 'endTime' as const,
        value: '10:00',
        errorField: 'endTime' as const,
      },
      {
        field: 'startMeridiem' as const,
        value: 'PM' as const,
        errorField: 'endTime' as const,
      },
      {
        field: 'endMeridiem' as const,
        value: 'PM' as const,
        errorField: 'endTime' as const,
      },
    ])(
      'should clear $errorField error when $field is updated',
      ({ field, value, errorField }) => {
        getStore().validate();
        expect(getStore().availabilityRows[0].errors[errorField]).toBeDefined();

        getStore().updateAvailabilityRow(INITIAL_ROW_ID, field, value as never);

        expect(
          getStore().availabilityRows[0].errors[errorField],
        ).toBeUndefined();
      },
    );
  });

  describe('toggleDayOfWeek', () => {
    it('should remove a day when it is already selected and clear daysOfWeek error if days remain', () => {
      useAddServiceStore.setState({
        availabilityRows: [
          {
            ...getStore().availabilityRows[0],
            errors: {
              daysOfWeek: 'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED',
            },
          },
        ],
      });

      getStore().toggleDayOfWeek(INITIAL_ROW_ID, 'MONDAY');

      expect(getStore().availabilityRows[0].daysOfWeek).not.toContain('MONDAY');
      expect(getStore().availabilityRows[0].errors.daysOfWeek).toBeUndefined();
    });

    it('should add a day when it is not selected', () => {
      getStore().addAvailabilityRow();
      const newRowId = getStore().availabilityRows[1].id;

      getStore().toggleDayOfWeek(newRowId, 'MONDAY');

      expect(getStore().availabilityRows[1].daysOfWeek).toContain('MONDAY');
    });

    it('should clear daysOfWeek error when a day is added to an empty selection', () => {
      getStore().addAvailabilityRow();
      const newRowId = getStore().availabilityRows[1].id;
      getStore().setName('Test Service');
      getStore().updateAvailabilityRow(newRowId, 'startTime', '9:00');
      getStore().updateAvailabilityRow(newRowId, 'endTime', '10:00');
      getStore().validate();
      expect(getStore().availabilityRows[1].errors.daysOfWeek).toBeDefined();

      getStore().toggleDayOfWeek(newRowId, 'MONDAY');

      expect(getStore().availabilityRows[1].errors.daysOfWeek).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return false and set nameError when name is empty', () => {
      const isValid = getStore().validate();

      expect(isValid).toBe(false);
      expect(getStore().nameError).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED',
      );
    });

    it.each([
      {
        scenario: 'startTime is empty',
        setup: () => {},
        errorField: 'startTime' as const,
        expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_START_TIME_REQUIRED',
      },
      {
        scenario: 'endTime is empty',
        setup: () =>
          getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'startTime', '9:00'),
        errorField: 'endTime' as const,
        expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_REQUIRED',
      },
      {
        scenario: 'endTime is not after startTime',
        setup: () => {
          getStore().updateAvailabilityRow(
            INITIAL_ROW_ID,
            'startTime',
            '10:00',
          );
          getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'endTime', '9:00');
        },
        errorField: 'endTime' as const,
        expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_AFTER_START',
      },
    ])(
      'should return false and set $errorField error when $scenario',
      ({ setup, errorField, expectedError }) => {
        getStore().setName('Test Service');
        setup();

        const isValid = getStore().validate();

        expect(isValid).toBe(false);
        expect(getStore().availabilityRows[0].errors[errorField]).toBe(
          expectedError,
        );
      },
    );

    it('should return false and set daysOfWeek error when no days are selected', () => {
      getStore().addAvailabilityRow();
      const newRowId = getStore().availabilityRows[1].id;
      getStore().setName('Test Service');
      getStore().updateAvailabilityRow(newRowId, 'startTime', '9:00');
      getStore().updateAvailabilityRow(newRowId, 'endTime', '10:00');

      const isValid = getStore().validate();

      expect(isValid).toBe(false);
      expect(getStore().availabilityRows[1].errors.daysOfWeek).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED',
      );
    });

    it('should return true and clear all errors when all fields are valid', () => {
      getStore().setName('Test Service');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'startTime', '9:00');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'endTime', '10:00');

      const isValid = getStore().validate();

      expect(isValid).toBe(true);
      expect(getStore().nameError).toBeNull();
      expect(getStore().availabilityRows[0].errors).toEqual({});
    });
  });

  describe('reset', () => {
    it('should restore all state to initial values', () => {
      getStore().setName('Test');
      getStore().setDescription('Desc');
      getStore().setDurationMins(30);
      getStore().addAvailabilityRow();

      getStore().reset();

      const state = getStore();
      expect(state.name).toBe('');
      expect(state.description).toBe('');
      expect(state.durationMins).toBeNull();
      expect(state.availabilityRows).toHaveLength(1);
      expect(state.availabilityRows[0].daysOfWeek).toEqual([...DAYS_OF_WEEK]);
    });
  });
});
