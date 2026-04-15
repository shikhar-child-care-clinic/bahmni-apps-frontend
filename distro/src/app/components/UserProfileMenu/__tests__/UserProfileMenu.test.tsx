import { logout, useTranslation, getFormattedError } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileMenu } from '../UserProfileMenu';

jest.mock('@bahmni/widgets', () => ({
  useActivePractitioner: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
  logout: jest.fn(),
  notificationService: {
    showError: jest.fn(),
  },
  getFormattedError: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  MenuButton: ({ label, children, className, ...props }: any) => (
    <button className={className} {...props}>
      {label}
      <div data-testid="menu-content">{children}</div>
    </button>
  ),
  MenuItem: ({ label, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {label}
    </button>
  ),
  MenuItemDivider: () => <hr data-testid="menu-divider" />,
}));

const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('UserProfileMenu', () => {
  const mockUser = {
    uuid: 'user-uuid-123',
    display: 'Dr. John Doe',
  };

  const mockTranslate = (key: string) => key;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActivePractitioner.mockReturnValue({
      practitioner: { uuid: 'practitioner-uuid' },
      user: mockUser,
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseTranslation.mockReturnValue({
      t: mockTranslate,
    } as any);

    mockGetFormattedError.mockReturnValue({
      title: 'Error',
      message: 'Something went wrong',
    });

    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  it('renders menu button with user greeting and display name', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('user-profile-menu')).toHaveTextContent(
      'Hi, Dr. John Doe',
    );
  });

  it('renders change password option', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('change-password-option')).toHaveTextContent(
      'HOME_CHANGE_PASSWORD',
    );
  });

  it('renders logout option', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('logout-option')).toHaveTextContent(
      'HOME_LOGOUT',
    );
  });

  it('renders menu divider', () => {
    render(<UserProfileMenu />);

    expect(screen.getByTestId('menu-divider')).toBeInTheDocument();
  });

  it('calls onChangePassword when change password option is clicked', () => {
    const onChangePassword = jest.fn();
    render(<UserProfileMenu onChangePassword={onChangePassword} />);

    const changePasswordBtn = screen.getByTestId('change-password-option');
    fireEvent.click(changePasswordBtn);

    expect(onChangePassword).toHaveBeenCalled();
  });

  it('calls logout and redirects on logout click', async () => {
    mockLogout.mockResolvedValue(undefined);

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByTestId('logout-option');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(window.location.href).toBe('/');
  });

  it('disables logout button while logging out', async () => {
    mockLogout.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByTestId('logout-option');
    fireEvent.click(logoutBtn);

    expect(logoutBtn).toBeDisabled();
  });

  it('shows loading state when user data is loading', () => {
    mockUseActivePractitioner.mockReturnValue({
      practitioner: null,
      user: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<UserProfileMenu />);

    expect(screen.getByText('LOADING')).toBeInTheDocument();
  });

  it('returns null when user data is not available', () => {
    mockUseActivePractitioner.mockReturnValue({
      practitioner: null,
      user: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { container } = render(<UserProfileMenu />);

    expect(container.firstChild).toBeNull();
  });

  it('handles logout error gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLogout.mockRejectedValue(new Error('Logout failed'));

    render(<UserProfileMenu />);

    const logoutBtn = screen.getByTestId('logout-option');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(logoutBtn).not.toBeDisabled();
    consoleErrorSpy.mockRestore();
  });
});
