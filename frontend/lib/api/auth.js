'use server';

import { cookies } from 'next/headers';
import { http } from './_http';
import { AUTH_ERRORS, MOCK_FORGOT_PASSWORD_RESPONSE } from '../mock-backend/auth';
import { clearMockSession } from '../mock-backend/session';

const MOCK_DELAY = 450;
const TOKEN_COOKIE = 'ft_auth_token';

function wait(ms = MOCK_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function authError(error) {
  const err = new Error(error.message);
  err.code = error.code;
  return err;
}

function isValidEmail(email) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

async function setAuthToken(token) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

async function clearAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

export async function loginUser({ email, password, remember }) {
  const { token, user } = await http.post('/auth/login', { email, password });
  await setAuthToken(token);
  return { token, remember: Boolean(remember), user };
}

export async function registerUser({ name, birthDate, birthTime, birthPlace, email, password }) {
  const { token, user } = await http.post('/auth/register', {
    name, birthDate, birthTime, birthPlace, email, password,
  });
  await setAuthToken(token);
  return { token, user: { ...user, profileComplete: false } };
}

export async function forgotPassword(email) {
  await wait();

  // TODO: Replace with http.post('/auth/forgot-password', { email }). Never reveal whether email exists.
  if (!isValidEmail(email)) throw authError(AUTH_ERRORS.INVALID_EMAIL);
  return MOCK_FORGOT_PASSWORD_RESPONSE;
}

export async function logoutUser() {
  await clearAuthToken();
  await clearMockSession();
  return { ok: true };
}

export async function getAuthenticatedUser() {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const { user } = await http.get('/auth/me', { token });
    return user;
  } catch {
    return null;
  }
}
