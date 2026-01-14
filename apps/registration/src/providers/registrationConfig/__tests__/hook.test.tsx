import { renderHook } from '@testing-library/react';
import {
  useRegistrationConfig,
  RegistrationConfigContext,
  RegistrationConfigContextType,
} from '..';

describe('useRegistrationConfig', () => {
  it('should return the clinical config context values', () => {
    const mockContextValue: RegistrationConfigContextType = {
      registrationConfig: {
        patientSearch: {
          customAttributes: [],
          appointment: [],
        },
        defaultVisitType: 'visit',
        patientInformation: {},
        fieldValidation: {},
        extensionPoints: [],
        registrationAppExtensions: [],
      },
      isLoading: false,
      error: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RegistrationConfigContext.Provider value={mockContextValue}>
        {children}
      </RegistrationConfigContext.Provider>
    );

    const { result } = renderHook(() => useRegistrationConfig(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
  });

  it('should throw an error if used outside of RegistrationConfigProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useRegistrationConfig());
    }).toThrow(
      'useRegistrationConfig must be used within a RegistrationConfigProvider',
    );

    consoleError.mockRestore();
  });
});
