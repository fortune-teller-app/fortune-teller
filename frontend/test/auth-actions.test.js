import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  cookies: vi.fn(),
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
  clearMockSession: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('../lib/api/_http', () => ({ http: mocks.http }));
vi.mock('../lib/mock-backend/session', () => ({
  clearMockSession: mocks.clearMockSession,
}));

import {
  getAuthenticatedUser,
  loginUser,
  logoutUser,
} from '../lib/api/auth';

describe('frontend authentication actions', () => {
  beforeEach(() => {
    mocks.cookies.mockResolvedValue(mocks.cookieStore);
    mocks.cookieStore.get.mockReset();
    mocks.cookieStore.set.mockReset();
    mocks.cookieStore.delete.mockReset();
    mocks.http.get.mockReset();
    mocks.http.post.mockReset();
    mocks.clearMockSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('logs in through the API and stores the JWT only in an httpOnly session cookie', async () => {
    const user = { id: 'user-a', name: 'Aurora', email: 'aurora@example.com' };
    mocks.http.post.mockResolvedValue({ token: 'secret-jwt', user });

    const result = await loginUser({
      email: 'aurora@example.com',
      password: 'password123',
      remember: false,
    });

    expect(mocks.http.post).toHaveBeenCalledWith('/auth/login', {
      email: 'aurora@example.com',
      password: 'password123',
    });
    expect(mocks.cookieStore.set).toHaveBeenCalledWith('ft_auth_token', 'secret-jwt', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    expect(result).toEqual({ remember: false, user });
    expect(result).not.toHaveProperty('token');
  });

  it('keeps a remembered login for seven days', async () => {
    mocks.http.post.mockResolvedValue({
      token: 'secret-jwt',
      user: { id: 'user-a', name: 'Aurora', email: 'aurora@example.com' },
    });

    await loginUser({
      email: 'aurora@example.com',
      password: 'password123',
      remember: true,
    });

    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      'ft_auth_token',
      'secret-jwt',
      expect.objectContaining({ httpOnly: true, maxAge: 604800 })
    );
  });

  it('marks authentication cookies secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.http.post.mockResolvedValue({
      token: 'secret-jwt',
      user: { id: 'user-a', name: 'Aurora', email: 'aurora@example.com' },
    });

    await loginUser({
      email: 'aurora@example.com',
      password: 'password123',
      remember: false,
    });

    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      'ft_auth_token',
      'secret-jwt',
      expect.objectContaining({ secure: true })
    );
  });

  it('does not create a session when the API rejects the credentials', async () => {
    mocks.http.post.mockRejectedValue(new Error('Email or password is incorrect.'));

    await expect(loginUser({
      email: 'aurora@example.com',
      password: 'wrong-password',
      remember: false,
    })).rejects.toThrow('Email or password is incorrect.');

    expect(mocks.cookieStore.set).not.toHaveBeenCalled();
  });

  it('logs out by deleting both real and legacy mock session cookies', async () => {
    await expect(logoutUser()).resolves.toEqual({ ok: true });

    expect(mocks.cookieStore.delete).toHaveBeenCalledWith('ft_auth_token');
    expect(mocks.clearMockSession).toHaveBeenCalledOnce();
  });

  it('loads the current user with the cookie token', async () => {
    const user = { id: 'user-a', name: 'Aurora', email: 'aurora@example.com' };
    mocks.cookieStore.get.mockReturnValue({ value: 'secret-jwt' });
    mocks.http.get.mockResolvedValue({ user });

    await expect(getAuthenticatedUser()).resolves.toEqual(user);
    expect(mocks.http.get).toHaveBeenCalledWith('/auth/me', { token: 'secret-jwt' });
  });

  it('treats missing, expired, or invalid sessions as signed out', async () => {
    mocks.cookieStore.get.mockReturnValueOnce(undefined);
    await expect(getAuthenticatedUser()).resolves.toBeNull();
    expect(mocks.http.get).not.toHaveBeenCalled();

    mocks.cookieStore.get.mockReturnValueOnce({ value: 'expired-jwt' });
    mocks.http.get.mockRejectedValueOnce(new Error('Session expired'));
    await expect(getAuthenticatedUser()).resolves.toBeNull();
  });
});
