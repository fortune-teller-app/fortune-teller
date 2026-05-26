'use server';

import { MOCK_PREFERENCES } from '../mock-backend/preferences';
import { getMockUserId } from '../mock-backend/session';

const MOCK_DELAY = 150;

// Working copy for in-memory updates; MOCK_PREFERENCES itself grows as new users register.
let preferences = MOCK_PREFERENCES.map(item => ({ ...item }));

function wait(ms = MOCK_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCurrentPreferences() {
  await wait();

  // TODO: Replace with http.get('/preferences/me').
  const userId = await getMockUserId();
  return (
    preferences.find(item => item.userId === userId) ??
    MOCK_PREFERENCES.find(item => item.userId === userId) ??
    preferences[0]
  );
}

export async function updatePreference(key, value) {
  await wait();

  // TODO: Replace with http.patch('/preferences/me', { [key]: value }).
  const userId = await getMockUserId();
  const exists = preferences.some(item => item.userId === userId);

  if (exists) {
    preferences = preferences.map(item =>
      item.userId === userId ? { ...item, [key]: value } : item
    );
  } else {
    // Newly registered user — copy seed entry from MOCK_PREFERENCES and apply update.
    const seed = MOCK_PREFERENCES.find(item => item.userId === userId);
    if (seed) preferences.push({ ...seed, [key]: value });
  }

  return (
    preferences.find(item => item.userId === userId) ??
    preferences[0]
  );
}
