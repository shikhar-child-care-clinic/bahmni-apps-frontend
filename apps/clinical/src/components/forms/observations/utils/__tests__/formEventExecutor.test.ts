import { Form2Observation, FormMetadata } from '@bahmni/services';
import { executeOnFormSaveEvent, hasFormSaveEvent } from '../formEventExecutor';

describe('formEventExecutor', () => {
  const mockPatientUuid = 'patient-uuid-123';
  const mockObservations: Form2Observation[] = [
    {
      concept: { uuid: 'concept-uuid-1', name: 'Weight' },
      value: 70,
      formFieldPath: 'form.1/1-0',
    } as Form2Observation,
    {
      concept: { uuid: 'concept-uuid-2', name: 'Height' },
      value: 170,
      formFieldPath: 'form.1/2-0',
    } as Form2Observation,
  ];

  const createMockMetadata = (onFormSaveScript?: string): FormMetadata =>
    ({
      name: 'Test Form',
      uuid: 'form-uuid-123',
      version: '1',
      schema: {
        events: onFormSaveScript ? { onFormSave: onFormSaveScript } : undefined,
      },
    }) as FormMetadata;

  // Mock formData structure that matches Container's state.data format
  const mockFormData = {
    children: [
      {
        control: {
          concept: { name: 'Weight', uuid: 'concept-uuid-1' },
          label: { value: 'Weight' },
        },
        value: { value: 70, comment: undefined, interpretation: null },
      },
      {
        control: {
          concept: { name: 'Height', uuid: 'concept-uuid-2' },
          label: { value: 'Height' },
        },
        value: { value: 170, comment: undefined, interpretation: null },
      },
    ],
  };

  describe('executeOnFormSaveEvent', () => {
    beforeEach(() => {
      delete window.runEventScript;
    });

    afterEach(() => {
     
      delete window.runEventScript;
    });

    it('should return original observations when no onFormSave event exists', () => {
      const metadata = createMockMetadata();

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual(mockObservations);
    });

    it('should execute function body format script and return modified observations', () => {
      const script = `
        formContext.observations = formContext.observations.map(obs => ({
          ...obs,
          value: obs.value * 2
        }));
      `;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result[0].value).toBe(140);
      expect(result[1].value).toBe(340);
    });

    it('should execute anonymous function format script and return result', () => {
      const script = `function(formContext) {
        return formContext.observations.filter(obs => obs.value > 100);
      }`;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(170);
    });

    it('should provide formContext with patient uuid to the script', () => {
      const script = `
        if (formContext.patient.uuid === '${mockPatientUuid}') {
          formContext.observations = [];
        }
      `;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual([]);
    });

    it('should provide formContext with form metadata to the script', () => {
      const script = `
        if (formContext.formName === 'Test Form' && formContext.formUuid === 'form-uuid-123') {
          formContext.observations = [];
        }
      `;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual([]);
    });

    it('should return modified context observations when script does not return anything', () => {
      const script = `
        formContext.observations[0].value = 999;
      `;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result[0].value).toBe(999);
    });

    it('should throw error with form name context when script execution fails', () => {
      const script = `throw new Error('Validation failed');`;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Validation failed',
      );
    });

    it('should handle script that throws plain object error', () => {
      const script = `throw { message: 'Custom validation error' };`;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Custom validation error',
      );
    });

    it('should decode base64-encoded script correctly', () => {
      const script = 'formContext.observations = [];';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual([]);
    });

    it('should handle script with whitespace correctly', () => {
      const script = `

        function(formContext) {
          return formContext.observations;
        }

      `;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual(mockObservations);
    });

    it('should deep clone observations to prevent mutation of original array', () => {
      const script = `formContext.observations[0].value = 999;`;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid);

      expect(mockObservations[0].value).toBe(70);
    });

    it('should use window.runEventScript when available and return modified observations', () => {
      const modifiedObs = [{ ...mockObservations[0], value: 999 }];
      window.runEventScript = jest.fn().mockReturnValue(modifiedObs);

      const script = 'function() { return modified; }';
      const metadata = createMockMetadata(script);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
        mockFormData,
      );

      expect(window.runEventScript).toHaveBeenCalledWith(mockFormData, script, {
        uuid: mockPatientUuid,
      });
      expect(result).toEqual(modifiedObs);

      delete window.runEventScript;
    });

    it('should propagate errors from window.runEventScript', () => {
      window.runEventScript = jest.fn().mockImplementation(() => {
        throw new Error('Helper failed');
      });

      const script = 'formContext.observations = [];';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Helper failed',
      );

      delete window.runEventScript;
    });

    it('should throw error when script is not a string', () => {
      const metadata = {
        name: 'Test Form',
        uuid: 'form-uuid-123',
        version: '1',
        schema: {
          events: { onFormSave: 123 as any },
        },
      } as FormMetadata;

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Invalid onFormSave script: not a string or empty',
      );
    });

    it('should throw error when script is empty string', () => {
      const metadata = createMockMetadata('   ');

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Invalid onFormSave script: not a string or empty',
      );
    });

    it('should handle non-base64 plain text scripts', () => {
      const script = 'formContext.observations = [];';
      const metadata = createMockMetadata(script);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual([]);
    });

    it('should handle script throwing unknown error type', () => {
      const script = 'throw 12345;';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Unknown error occurred',
      );
    });

    it('should include formData in formContext when provided', () => {
      const script = `
        if (formContext.formData) {
          formContext.observations = [];
        }
      `;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
        mockFormData,
      );

      expect(result).toEqual([]);
    });
  });

  describe('hasFormSaveEvent', () => {
    it('should return true when form metadata contains onFormSave event', () => {
      const metadata = createMockMetadata(btoa('some script'));

      const result = hasFormSaveEvent(metadata);

      expect(result).toBe(true);
    });

    it('should return false when form metadata has no events', () => {
      const metadata = createMockMetadata();

      const result = hasFormSaveEvent(metadata);

      expect(result).toBe(false);
    });

    it('should return false when metadata is null', () => {
      const result = hasFormSaveEvent(null);

      expect(result).toBe(false);
    });

    it('should return false when schema has no events property', () => {
      const metadata = {
        name: 'Test Form',
        uuid: 'form-uuid-123',
        version: '1',
        schema: {},
      } as FormMetadata;

      const result = hasFormSaveEvent(metadata);

      expect(result).toBe(false);
    });
  });
});
