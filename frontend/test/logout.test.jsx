import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  logoutUser: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('../lib/api/auth', () => ({ logoutUser: mocks.logoutUser }));

import SignOutRow from '../app/(app)/settings/SignOutRow';

describe('logout control', () => {
  beforeEach(() => {
    mocks.logoutUser.mockReset();
    mocks.replace.mockReset();
  });

  it('clears the session and returns the user to login', async () => {
    const user = userEvent.setup();
    mocks.logoutUser.mockResolvedValue({ ok: true });
    render(<SignOutRow />);

    await user.click(screen.getByRole('button', { name: /Sign out/ }));

    await waitFor(() => {
      expect(mocks.logoutUser).toHaveBeenCalledOnce();
      expect(mocks.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('still returns to login if session cleanup reports an error', async () => {
    const user = userEvent.setup();
    mocks.logoutUser.mockRejectedValue(new Error('cleanup failed'));
    render(<SignOutRow />);

    await user.click(screen.getByRole('button', { name: /Sign out/ }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
  });
});
