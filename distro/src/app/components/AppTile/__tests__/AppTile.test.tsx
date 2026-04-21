import { useTranslation } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppTile } from '../AppTile';

expect.extend(toHaveNoViolations);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/widgets', () => ({
  useHasPrivilege: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  Tile: ({ children, onClick, className, ...props }: any) => (
    <div onClick={onClick} className={className} data-testid="tile" {...props}>
      {children}
    </div>
  ),
  Icon: ({ name, id, ...props }: any) => (
    <div data-testid={`icon-${id}`} {...props}>
      {name}
    </div>
  ),
  ICON_SIZE: { LG: 'lg' },
}));

const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('AppTile', () => {
  const defaultProps = {
    id: 'registration',
    label: 'HOME_MODULE_REGISTRATION',
    icon: 'registration',
    url: '/registration',
    privileges: ['Add Patients'],
  };

  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key, // Return key as-is for testing
    } as any);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders tile when user has access', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByText('HOME_MODULE_REGISTRATION')).toBeInTheDocument();
  });

  it('does not render when user lacks access', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    const { container } = render(<AppTile {...defaultProps} />);

    expect(container.firstChild).toBeNull();
  });

  it('uses window.location.href for hash URLs on click', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.click(tile);

    expect(window.location.href).toBe(
      '/bahmni/registration/index.html#/patient/search',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('uses react router navigate for relative URLs on click', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<AppTile {...defaultProps} url="registration" />);

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.click(tile);

    expect(mockNavigate).toHaveBeenCalledWith('registration');
  });

  it('renders tile without privileges when not specified', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    const propsWithoutPrivileges = {
      ...defaultProps,
      privileges: undefined,
    };

    render(<AppTile {...propsWithoutPrivileges} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
  });

  it('renders icon with correct name and id', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('icon-registration')).toBeInTheDocument();
    expect(screen.getByTestId('icon-registration')).toHaveTextContent(
      'registration',
    );
  });

  it('passes privileges to useHasPrivilege hook', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<AppTile {...defaultProps} />);

    expect(mockUseHasPrivilege).toHaveBeenCalledWith(defaultProps.privileges);
  });

  it('activates on Enter key', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.keyDown(tile, { key: 'Enter' });

    expect(window.location.href).toBe(
      '/bahmni/registration/index.html#/patient/search',
    );
  });

  it('activates on Space key', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.keyDown(tile, { key: ' ' });

    expect(window.location.href).toBe(
      '/bahmni/registration/index.html#/patient/search',
    );
  });

  it('has no accessibility violations', async () => {
    mockUseHasPrivilege.mockReturnValue(true);

    const { container } = render(<AppTile {...defaultProps} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
