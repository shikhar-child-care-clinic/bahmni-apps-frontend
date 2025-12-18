import { extractFormTranslations } from '../formTranslationExtractor';

describe('extractFormTranslations', () => {
  it('should extract translations from API array response for specified locale', () => {
    const apiResponse = [
      {
        locale: 'en',
        labels: {
          BLOOD_PRESSURE_1: 'Blood Pressure',
          TEMPERATURE_2: 'Temperature',
        },
        concepts: {
          PULSE_14: 'Pulse',
          SITTING_21: 'Sitting',
        },
      },
      {
        locale: 'es',
        labels: {
          BLOOD_PRESSURE_1: 'Presión Arterial',
          TEMPERATURE_2: 'Temperatura',
        },
        concepts: {
          PULSE_14: 'Frecuencia del pulso',
          SITTING_21: 'Sentado',
        },
      },
    ];

    const result = extractFormTranslations(apiResponse, 'es');

    expect(result).toEqual({
      labels: {
        BLOOD_PRESSURE_1: 'Presión Arterial',
        TEMPERATURE_2: 'Temperatura',
      },
      concepts: {
        PULSE_14: 'Frecuencia del pulso',
        SITTING_21: 'Sentado',
      },
    });
  });

  it('should return empty translations when locale not found in array', () => {
    const apiResponse = [
      {
        locale: 'en',
        labels: { FIELD_1: 'Field 1' },
        concepts: { CONCEPT_1: 'Concept 1' },
      },
    ];

    const result = extractFormTranslations(apiResponse, 'fr');

    expect(result).toEqual({ labels: {}, concepts: {} });
  });

  it('should return empty translations when data is not an array', () => {
    const result = extractFormTranslations({ invalid: 'data' }, 'en');
    expect(result).toEqual({ labels: {}, concepts: {} });
  });

  it('should handle null or undefined data', () => {
    expect(extractFormTranslations(null, 'en')).toEqual({
      labels: {},
      concepts: {},
    });
    expect(extractFormTranslations(undefined, 'en')).toEqual({
      labels: {},
      concepts: {},
    });
  });

  it('should handle missing labels or concepts in API response', () => {
    const apiResponse = [
      {
        locale: 'en',
        labels: { FIELD_1: 'Field 1' },
        // concepts missing
      },
    ];

    const result = extractFormTranslations(apiResponse, 'en');

    expect(result).toEqual({
      labels: { FIELD_1: 'Field 1' },
      concepts: {},
    });
  });
});
