'use server';

import { AUTH_ERRORS, MOCK_FORGOT_PASSWORD_RESPONSE } from '../mock-backend/auth';
import { setMockSession, clearMockSession } from '../mock-backend/session';
import { MOCK_USERS } from '../mock-backend/users';
import { MOCK_PREFERENCES } from '../mock-backend/preferences';
import { MOCK_SUBSCRIPTIONS } from '../mock-backend/billing';

const MOCK_DELAY = 450;

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

export async function loginUser({ email, password, remember }) {
  await wait();

  // TODO: Replace with http.post('/auth/login', { email, password, remember }) and remove mock validation.
  if (!isValidEmail(email)) throw authError(AUTH_ERRORS.INVALID_EMAIL);
  if (!password) throw authError(AUTH_ERRORS.MISSING_PASSWORD);

  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) throw authError(AUTH_ERRORS.INVALID_CREDENTIALS);

  await setMockSession(user.id);

  return {
    token: 'mock-session-token',
    remember: Boolean(remember),
    user: { id: user.id, name: user.fullName, email: user.email },
  };
}

export async function registerUser({ name, birthDate, birthTime, birthPlace, email, password }) {
  await wait();

  // TODO: Replace with http.post('/auth/register', payload) and remove mock user creation.
  if (!name?.trim()) throw authError(AUTH_ERRORS.MISSING_NAME);
  if (!birthDate?.trim()) throw authError(AUTH_ERRORS.MISSING_BIRTH_DATE);
  if (!isValidEmail(email)) throw authError(AUTH_ERRORS.INVALID_EMAIL);
  if (!password || password.length < 8) throw authError(AUTH_ERRORS.WEAK_PASSWORD);

  const newUser = {
    id: `user_reg_${Date.now()}`,
    firstName: name.trim().split(' ')[0],
    fullName: name.trim(),
    avatarInitial: name.trim()[0].toUpperCase(),
    email,
    password,
    birthDate,
    birthTime: birthTime || null,
    birthPlace: birthPlace || null,
    roleLabel: 'Seeker',
    sunSign: 'Unknown',
    risingSign: 'Unknown',
    joinedAt: new Date().toISOString().slice(0, 10),
    subscriptionId: `sub_reg_${Date.now()}`,
  };

  MOCK_USERS.push(newUser);

  MOCK_PREFERENCES.push({
    userId: newUser.id,
    dailyReminderEnabled: false,
    dailyReminderTime: '07:00',
    dailyReminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    marketingEmails: false,
  });

  MOCK_SUBSCRIPTIONS.push({
    id: newUser.subscriptionId,
    userId: newUser.id,
    planId: 'seeker',
    status: 'free',
    statusLabel: 'Free membership',
    startedAt: newUser.joinedAt,
    renewsAt: null,
    paymentSummary: 'No payment method',
  });

  await setMockSession(newUser.id);

  return {
    token: 'mock-session-token',
    user: { id: newUser.id, name: newUser.fullName, email: newUser.email, profileComplete: false },
  };
}

export async function forgotPassword(email) {
  await wait();

  // TODO: Replace with http.post('/auth/forgot-password', { email }). Never reveal whether email exists.
  if (!isValidEmail(email)) throw authError(AUTH_ERRORS.INVALID_EMAIL);
  return MOCK_FORGOT_PASSWORD_RESPONSE;
}

export async function logoutUser() {
  await wait(200);

  // TODO: Replace with http.post('/auth/logout').
  await clearMockSession();
  return { ok: true };
}
