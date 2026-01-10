import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../components/LoginForm';

const defaultProps = {
  onSubmit: jest.fn(),
  isLoading: false,
  error: null,
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with username and password fields', () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByTestId('login-container-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('login-username-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('login-submitBtn-test-id')).toBeInTheDocument();
  });

  it('should call onSubmit with valid credentials', () => {
    render(<LoginForm {...defaultProps} />);

    const usernameInput = screen.getByTestId('login-username-test-id');
    const passwordInput = screen.getByTestId('login-password-test-id');
    const submitButton = screen.getByTestId('login-submitBtn-test-id');

    fireEvent.change(usernameInput, {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });

    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
  });

  it('should not call onSubmit with empty fields', () => {
    render(<LoginForm {...defaultProps} />);

    const submitButton = screen.getByTestId('login-submitBtn-test-id');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should display error notification when error prop is provided', () => {
    render(
      <LoginForm {...defaultProps} error="LOGIN_ERROR_INVALID_CREDENTIALS" />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should disable form inputs when loading', () => {
    render(<LoginForm {...defaultProps} isLoading />);

    const usernameInput = screen.getByTestId('login-username-test-id');
    const passwordInput = screen.getByTestId('login-password-test-id');
    const submitButton = screen.getByTestId('login-submitBtn-test-id');

    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
