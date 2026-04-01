import { initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ClinicalApp } from '../App';

jest.mock('@bahmni/services', () => ({
  initAppI18n: jest.fn(),
  initializeAuditListener: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  initFontAwesome: jest.fn(),
  suppressResizeObserverErrors: jest.fn(),
  Loading: () => <div data-testid="loading" />,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

jest.mock('@bahmni/widgets', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) =>
    children as React.ReactElement,
  NotificationServiceComponent: () => null,
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
    children as React.ReactElement,
  ActivePractitionerProvider: ({ children }: { children: React.ReactNode }) =>
    children as React.ReactElement,
}));

jest.mock('../providers/clinicalConfig', () => ({
  ClinicalConfigProvider: ({ children }: { children: React.ReactNode }) =>
    children as React.ReactElement,
}));

jest.mock('../pages/ConsultationPage', () => ({
  __esModule: true,
  default: () => <div data-testid="consultation-page" />,
}));

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={['/patient-uuid']}>
      <ClinicalApp />
    </MemoryRouter>,
  );

describe('ClinicalApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading before initialisation completes', () => {
    (initAppI18n as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderApp();

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders app content after successful initialisation', async () => {
    (initAppI18n as jest.Mock).mockResolvedValue(undefined);

    renderApp();

    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument(),
    );
    expect(initFontAwesome).toHaveBeenCalled();
    expect(initializeAuditListener).toHaveBeenCalled();
  });

  it('renders app content even when initialisation throws', async () => {
    (initAppI18n as jest.Mock).mockRejectedValue(new Error('init failed'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    renderApp();

    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument(),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to initialize app:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
