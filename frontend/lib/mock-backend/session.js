import { cookies } from 'next/headers';

export const DEFAULT_USER_ID = 'user_liora';
const COOKIE_NAME = 'mock_user_id';

export async function getMockUserId() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value ?? DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}

export async function setMockSession(userId) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearMockSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
