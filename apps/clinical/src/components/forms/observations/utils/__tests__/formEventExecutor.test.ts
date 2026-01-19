import { Form2Observation, FormMetadata } from '@bahmni/services';
import {
  executeOnFormSaveEvent,
  hasFormSaveEvent,
  getFormSaveEventScript,
} from '../formEventExecutor';

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

  describe('executeOnFormSaveEvent', () => {
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
      expect(result[0].concept.name).toBe('Height');
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
      ).toThrow('Failed to execute onFormSave event for form "Test Form"');
    });

    it('should handle script that throws plain object error', () => {
      const script = `throw { message: 'Custom validation error' };`;
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow('Failed to execute onFormSave event for form "Test Form"');
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

    // Backward compatibility tests for form.get() method
    describe('Backward compatibility - form.get() method', () => {
      it('should support legacy scripts using form.get() to find observations by concept UUID', () => {
        const script = `function(form) {
          var weightObs = form.get('concept-uuid-1');
          if (weightObs) {
            weightObs.value = weightObs.value + 10;
          }
          return form.observations;
        }`;
        const encodedScript = btoa(script);
        const metadata = createMockMetadata(encodedScript);

        const result = executeOnFormSaveEvent(
          metadata,
          mockObservations,
          mockPatientUuid,
        );

        expect(result[0].value).toBe(80);
      });

      it('should support formContext.get() in new style scripts', () => {
        const script = `function(formContext) {
          var heightObs = formContext.get('concept-uuid-2');
          if (heightObs) {
            heightObs.value = heightObs.value + 5;
          }
          return formContext.observations;
        }`;
        const encodedScript = btoa(script);
        const metadata = createMockMetadata(encodedScript);

        const result = executeOnFormSaveEvent(
          metadata,
          mockObservations,
          mockPatientUuid,
        );

        expect(result[1].value).toBe(175);
      });

      it('should return wrapper with null currentRecord when form.get() does not find matching concept', () => {
        const script = `function(form) {
          var missingObs = form.get('non-existent-uuid');
          // Check using currentRecord property (Docker backward compatibility)
          if (!missingObs.currentRecord) {
            form.observations = [];
          }
          return form.observations;
        }`;
        const encodedScript = btoa(script);
        const metadata = createMockMetadata(encodedScript);

        const result = executeOnFormSaveEvent(
          metadata,
          mockObservations,
          mockPatientUuid,
        );

        expect(result).toEqual([]);
      });

      it('should handle scripts that use both form.get() and direct observations access', () => {
        const script = `function(form) {
          var weightObs = form.get('concept-uuid-1');
          if (weightObs && form.observations.length > 1) {
            weightObs.value = 100;
          }
          return form.observations;
        }`;
        const encodedScript = btoa(script);
        const metadata = createMockMetadata(encodedScript);

        const result = executeOnFormSaveEvent(
          metadata,
          mockObservations,
          mockPatientUuid,
        );

        expect(result[0].value).toBe(100);
        expect(result).toHaveLength(2);
      });

      it('should support form.get() in function body scripts with form variable available', () => {
        const script = `
          var obs = form.get('concept-uuid-1');
          if (obs) {
            obs.value = 999;
          }
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

      it('should handle complex legacy validation script with form.get() and error throwing', () => {
        // Create custom observations with value > 200 to trigger the error
        const observationsWithHighValue: Form2Observation[] = [
          {
            concept: { uuid: 'concept-uuid-1', name: 'Weight' },
            value: 70,
            formFieldPath: 'form.1/1-0',
          } as Form2Observation,
          {
            concept: { uuid: 'concept-uuid-2', name: 'Height' },
            value: 250, // Value > 200 to trigger the error
            formFieldPath: 'form.1/2-0',
          } as Form2Observation,
        ];

        const script = `function(form) {
          let today = Date.now();
          let dateObs = form.get('concept-uuid-2');

          if (dateObs && dateObs.value > 200) {
            throw new Error('Value too high');
          }

          return form.observations;
        }`;
        const encodedScript = btoa(script);
        const metadata = createMockMetadata(encodedScript);

        expect(() =>
          executeOnFormSaveEvent(metadata, observationsWithHighValue, mockPatientUuid),
        ).toThrow('Value too high');
      });
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

  describe('getFormSaveEventScript', () => {
    it('should decode and return the onFormSave script', () => {
      const script = 'function(form) { return form.observations; }';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = getFormSaveEventScript(metadata);

      expect(result).toBe(script);
    });

    it('should return null when no onFormSave event exists', () => {
      const metadata = createMockMetadata();

      const result = getFormSaveEventScript(metadata);

      expect(result).toBeNull();
    });

    it('should return null when base64 decoding fails', () => {
      const metadata = {
        name: 'Test Form',
        uuid: 'form-uuid-123',
        version: '1',
        schema: {
          events: {
            onFormSave: 'invalid-base64!!!',
          },
        },
      } as FormMetadata;

      const result = getFormSaveEventScript(metadata);

      expect(result).toBeNull();
    });

    it('should handle empty script correctly', () => {
      const encodedScript = btoa('');
      const metadata = createMockMetadata(encodedScript);

      const result = getFormSaveEventScript(metadata);

      expect(result).toBeNull();
    });
  });
});
