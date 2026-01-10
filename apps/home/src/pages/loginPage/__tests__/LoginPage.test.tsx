import * as services from '@bahmni/services';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  loginUser: jest.fn(),
}));

describe('LoginPage', () => {
  it('should render login page', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login-page-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('login-container-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('login-submitBtn-test-id')).toBeInTheDocument();
  });
  it('should make a login request when user submits the form with credentials', async () => {
    const mockLoginUser = jest.spyOn(services, 'loginUser').mockResolvedValue({
      authenticated: true,
      user: { username: 'testuser' },
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('login-page-test-id')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('should show error notification when user authentication fails', async () => {
    const mockLoginUser = jest.spyOn(services, 'loginUser').mockResolvedValue({
      authenticated: false,
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const usernameInput = screen.getByTestId('login-username-test-id');
    const passwordInput = screen.getByTestId('login-password-test-id');
    const submitButton = screen.getByTestId('login-submitBtn-test-id');

    fireEvent.change(usernameInput, {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'wrongpassword',
      });
      expect(
        screen.getByText('Invalid username or password'),
      ).toBeInTheDocument();
    });
  });

  it('should show error notification when user authentication throws error', async () => {
    const mockLoginUser = jest
      .spyOn(services, 'loginUser')
      .mockRejectedValue(new Error('Server Error'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const usernameInput = screen.getByTestId('login-username-test-id');
    const passwordInput = screen.getByTestId('login-password-test-id');
    const submitButton = screen.getByTestId('login-submitBtn-test-id');

    fireEvent.change(usernameInput, {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'wrongpassword',
      });
      expect(
        screen.getByText(
          'The server encountered an error. Please try again later.',
        ),
      ).toBeInTheDocument();
    });
  });
});
