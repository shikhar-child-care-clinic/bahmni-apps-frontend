import { fetchWhiteLabelConfig } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { HomePageHeader } from '../HomePageHeader';

jest.mock('@bahmni/services', () => ({
  __esModule: true,
  fetchWhiteLabelConfig: jest.fn(),
  stripHeaderHtml: (raw?: string) =>
    !raw
      ? ''
      : raw
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
}));

jest.mock('@carbon/react', () => ({
  Header: ({ children, ...props }: any) => (
    <header {...props}>{children}</header>
  ),
  HeaderName: ({ prefix, children }: any) => (
    <div data-testid="header-name">
      <span>{prefix}</span>
      {children}
    </div>
  ),
  HeaderGlobalBar: ({ children }: any) => (
    <div data-testid="header-global-bar">{children}</div>
  ),
}));

jest.mock('../../LocationSelector', () => ({
  LocationSelector: () => (
    <div data-testid="location-selector">Location Selector</div>
  ),
}));

jest.mock('../../UserProfileMenu', () => ({
  UserProfileMenu: () => (
    <div data-testid="user-profile-menu">User Profile Menu</div>
  ),
}));

describe('HomePageHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWhiteLabelConfig as jest.Mock).mockResolvedValue({});
  });

  it('renders the header with a fallback aria-label when whitelabel is empty', async () => {
    render(<HomePageHeader />);

    const header = screen.getByTestId('home-page-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('aria-label', 'Bahmni');
  });

  it('renders Home prefix', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('header-name')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders location selector', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('location-selector')).toBeInTheDocument();
  });

  it('renders user profile menu', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('user-profile-menu')).toBeInTheDocument();
  });

  it('renders both location and user components in header global bar', () => {
    render(<HomePageHeader />);

    const globalBar = screen.getByTestId('header-global-bar');
    expect(globalBar).toContainElement(screen.getByTestId('location-selector'));
    expect(globalBar).toContainElement(screen.getByTestId('user-profile-menu'));
  });

  it('renders clinic name, subtitle, and logo from whiteLabel config', async () => {
    (fetchWhiteLabelConfig as jest.Mock).mockResolvedValue({
      homePage: {
        header_text: '<b>SHIKHAR CHILD CARE<br />AND VACCINATION CLINIC',
        title_text: 'Pediatrics | Vaccination | Pharmacy',
        logo: '/bahmni_config/openmrs/apps/home/images/clinic.png',
      },
    });

    render(<HomePageHeader />);

    await waitFor(() => {
      expect(screen.getByTestId('clinic-name')).toHaveTextContent(
        'SHIKHAR CHILD CARE AND VACCINATION CLINIC',
      );
    });
    expect(screen.getByTestId('clinic-subtitle')).toHaveTextContent(
      'Pediatrics | Vaccination | Pharmacy',
    );
    const logo = screen.getByTestId('clinic-logo') as HTMLImageElement;
    expect(logo).toHaveAttribute(
      'src',
      '/bahmni_config/openmrs/apps/home/images/clinic.png',
    );
    expect(screen.getByTestId('home-page-header')).toHaveAttribute(
      'aria-label',
      'SHIKHAR CHILD CARE AND VACCINATION CLINIC',
    );
  });

  it('omits logo and subtitle when not configured', async () => {
    (fetchWhiteLabelConfig as jest.Mock).mockResolvedValue({
      homePage: { header_text: 'Some Clinic' },
    });

    render(<HomePageHeader />);

    await waitFor(() => {
      expect(screen.getByTestId('clinic-name')).toHaveTextContent(
        'Some Clinic',
      );
    });
    expect(screen.queryByTestId('clinic-logo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('clinic-subtitle')).not.toBeInTheDocument();
  });
});
