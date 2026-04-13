import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppTile } from '../AppTile';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/widgets', () => ({
  useHasPrivilege: jest.fn(),
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

describe('AppTile', () => {
  const defaultProps = {
    id: 'registration',
    label: 'Registration',
    icon: 'registration',
    url: '/registration',
    privileges: ['Add Patients'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders tile when user has access', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByText('Registration')).toBeInTheDocument();
  });

  it('does not render when user lacks access', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    const { container } = render(<AppTile {...defaultProps} />);

    expect(container.firstChild).toBeNull();
  });

  it('navigates to url on tile click', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<AppTile {...defaultProps} />);

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.click(tile);

    expect(mockNavigate).toHaveBeenCalledWith('/registration');
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
});
