import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loginUser: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('../lib/api/auth', () => ({ loginUser: mocks.loginUser }));

import Login from '../app/(auth)/login/page';

describe('login page', () => {
  beforeEach(() => {
    mocks.loginUser.mockReset();
    mocks.push.mockReset();
  });

  it('submits the entered credentials and navigates to the protected app', async () => {
    const user = userEvent.setup();
    mocks.loginUser.mockResolvedValue({
      user: { id: 'user-a', name: 'Aurora', email: 'aurora@example.com' },
    });
    const { container } = render(<Login />);

    await user.type(container.querySelector('input[type="email"]'), 'aurora@example.com');
    await user.type(container.querySelector('input[type="password"]'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Remember' }));
    await user.click(screen.getByRole('button', { name: /Enter/ }));

    await waitFor(() => {
      expect(mocks.loginUser).toHaveBeenCalledWith({
        email: 'aurora@example.com',
        password: 'password123',
        remember: true,
      });
      expect(mocks.push).toHaveBeenCalledWith('/home');
    });
  });

  it('shows a safe login error and does not navigate on rejected credentials', async () => {
    mocks.loginUser.mockRejectedValue(new Error('Email or password is incorrect.'));
    const { container } = render(<Login />);

    fireEvent.change(container.querySelector('input[type="email"]'), {
      target: { value: 'aurora@example.com' },
    });
    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enter/ }));

    expect(await screen.findByText('Email or password is incorrect.')).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('disables the submit button while a login request is pending', async () => {
    let finishLogin;
    mocks.loginUser.mockImplementation(() => new Promise((resolve) => {
      finishLogin = resolve;
    }));
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /Enter/ }));

    expect(screen.getByRole('button', { name: 'Entering...' })).toBeDisabled();
    finishLogin({ user: { id: 'user-a' } });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/home'));
  });
});
