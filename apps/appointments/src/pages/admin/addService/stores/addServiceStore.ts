import { addMinutesToTime, generateId, timeToMinutes } from '@bahmni/services';
import { create } from 'zustand';
import { DAYS_OF_WEEK } from '../constants';

const isValidTime = (time: string): boolean => /^\d{1,2}:\d{2}$/.test(time);

const isEndTimeAfterStartTime = (
  startTime: string,
  startMeridiem: 'AM' | 'PM',
  endTime: string,
  endMeridiem: 'AM' | 'PM',
): boolean =>
  timeToMinutes(endTime, endMeridiem) > timeToMinutes(startTime, startMeridiem);

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface AvailabilityRow {
  id: string;
  startTime: string;
  startMeridiem: 'AM' | 'PM';
  endTime: string;
  endMeridiem: 'AM' | 'PM';
  isEndTimeUserSet: boolean;
  maxLoad: number | null;
  daysOfWeek: DayOfWeek[];
  errors: {
    startTime?: string;
    endTime?: string;
    daysOfWeek?: string;
  };
}

type UpdateField =
  | 'startTime'
  | 'startMeridiem'
  | 'endTime'
  | 'endMeridiem'
  | 'maxLoad';

const createRow = (allDaysSelected = false): AvailabilityRow => ({
  id: generateId(),
  startTime: '',
  startMeridiem: 'AM',
  endTime: '',
  endMeridiem: 'AM',
  isEndTimeUserSet: false,
  maxLoad: null,
  daysOfWeek: allDaysSelected ? [...DAYS_OF_WEEK] : [],
  errors: {},
});

const updateRowField = (
  row: AvailabilityRow,
  id: string,
  field: UpdateField,
  value: string | number | null,
  durationMins: number | null,
): AvailabilityRow => {
  if (row.id !== id) return row;
  const errors = { ...row.errors };

  if (field === 'startTime') {
    delete errors.startTime;
    const newStartTime = value as string;
    if (
      !row.isEndTimeUserSet &&
      durationMins !== null &&
      isValidTime(newStartTime)
    ) {
      const { time: endTime, meridiem: endMeridiem } = addMinutesToTime(
        newStartTime,
        row.startMeridiem,
        durationMins,
      );
      return {
        ...row,
        startTime: newStartTime,
        endTime,
        endMeridiem,
        errors,
      };
    }
    return { ...row, startTime: newStartTime, errors };
  }

  if (field === 'endTime') {
    delete errors.endTime;
    const isEndTimeUserSet =
      typeof value === 'string' && value.trim() !== '' && isValidTime(value);
    return { ...row, endTime: value as string, isEndTimeUserSet, errors };
  }

  if (field === 'startMeridiem' || field === 'endMeridiem') {
    delete errors.endTime;
    return { ...row, [field]: value, errors };
  }

  return { ...row, maxLoad: value as number | null, errors };
};

const toggleRowDay = (
  row: AvailabilityRow,
  rowId: string,
  day: DayOfWeek,
): AvailabilityRow => {
  if (row.id !== rowId) return row;
  const daysOfWeek = row.daysOfWeek.includes(day)
    ? row.daysOfWeek.filter((d) => d !== day)
    : [...row.daysOfWeek, day];
  const errors = { ...row.errors };
  if (daysOfWeek.length > 0) delete errors.daysOfWeek;
  return { ...row, daysOfWeek, errors };
};

const validateRow = (
  row: AvailabilityRow,
): { row: AvailabilityRow; rowIsValid: boolean } => {
  const errors: AvailabilityRow['errors'] = {};
  let rowIsValid = true;

  if (!row.startTime.trim()) {
    errors.startTime = 'ADMIN_ADD_SERVICE_VALIDATION_START_TIME_REQUIRED';
    rowIsValid = false;
  }

  if (!row.endTime.trim()) {
    errors.endTime = 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_REQUIRED';
    rowIsValid = false;
  } else if (
    row.startTime.trim() &&
    !isEndTimeAfterStartTime(
      row.startTime,
      row.startMeridiem,
      row.endTime,
      row.endMeridiem,
    )
  ) {
    errors.endTime = 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_AFTER_START';
    rowIsValid = false;
  }

  if (row.daysOfWeek.length === 0) {
    errors.daysOfWeek = 'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED';
    rowIsValid = false;
  }

  return { row: { ...row, errors }, rowIsValid };
};

interface AddServiceState {
  name: string;
  nameError: string | null;
  description: string;
  durationMins: number | null;
  specialityUuid: string | null;
  locationUuid: string | null;
  availabilityRows: AvailabilityRow[];

  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setDurationMins: (durationMins: number | null) => void;
  setSpecialityUuid: (uuid: string | null) => void;
  setLocationUuid: (uuid: string | null) => void;
  addAvailabilityRow: () => void;
  removeAvailabilityRow: (id: string) => void;
  updateAvailabilityRow: (
    id: string,
    field: UpdateField,
    value: string | number | null,
  ) => void;
  toggleDayOfWeek: (rowId: string, day: DayOfWeek) => void;
  validate: () => boolean;
  reset: () => void;
}

export const useAddServiceStore = create<AddServiceState>((set, get) => ({
  name: '',
  nameError: null,
  description: '',
  durationMins: null,
  specialityUuid: null,
  locationUuid: null,
  availabilityRows: [createRow(true)],

  setName: (name) => set({ name, nameError: null }),

  setDescription: (description) => set({ description }),

  setDurationMins: (durationMins) => set({ durationMins }),

  setSpecialityUuid: (specialityUuid) => set({ specialityUuid }),

  setLocationUuid: (locationUuid) => set({ locationUuid }),

  addAvailabilityRow: () =>
    set((state) => ({
      availabilityRows: [...state.availabilityRows, createRow()],
    })),

  removeAvailabilityRow: (id) =>
    set((state) => ({
      availabilityRows: state.availabilityRows.filter((row) => row.id !== id),
    })),

  updateAvailabilityRow: (id, field, value) =>
    set((state) => ({
      availabilityRows: state.availabilityRows.map((row) =>
        updateRowField(row, id, field, value, state.durationMins),
      ),
    })),

  toggleDayOfWeek: (rowId, day) =>
    set((state) => ({
      availabilityRows: state.availabilityRows.map((row) =>
        toggleRowDay(row, rowId, day),
      ),
    })),

  validate: () => {
    const state = get();
    let isValid = true;

    const nameError = state.name.trim()
      ? null
      : 'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED';

    if (nameError) isValid = false;

    const updatedRows = state.availabilityRows.map((row) => {
      const { row: validatedRow, rowIsValid } = validateRow(row);
      if (!rowIsValid) isValid = false;
      return validatedRow;
    });

    set({ nameError, availabilityRows: updatedRows });
    return isValid;
  },

  reset: () =>
    set({
      name: '',
      nameError: null,
      description: '',
      durationMins: null,
      specialityUuid: null,
      locationUuid: null,
      availabilityRows: [createRow(true)],
    }),
}));
