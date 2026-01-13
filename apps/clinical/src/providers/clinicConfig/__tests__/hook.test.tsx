import { renderHook } from '@testing-library/react';
import {
  useClinicalConfig,
  ClinicalConfigContext,
  ClinicalConfigContextType,
} from '..';

describe('useClinicalConfig', () => {
  it('should return the clinical config context values', () => {
    const mockContextValue: ClinicalConfigContextType = {
      clinicalConfig: {
        patientInformation: {},
        actions: [],
        dashboards: [],
        consultationPad: {
          allergyConceptMap: {
            medicationAllergenUuid: 'med-uuid',
            foodAllergenUuid: 'food-uuid',
            environmentalAllergenUuid: 'env-uuid',
            allergyReactionUuid: 'reaction-uuid',
          },
        },
      },
      isLoading: false,
      error: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClinicalConfigContext.Provider value={mockContextValue}>
        {children}
      </ClinicalConfigContext.Provider>
    );

    const { result } = renderHook(() => useClinicalConfig(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
  });

  it('should throw an error if used outside of ClinicalConfigProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useClinicalConfig());
    }).toThrow(
      'useClinicalConfig must be used within a ClinicalConfigProvider',
    );

    consoleError.mockRestore();
  });
});
