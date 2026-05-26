import { getMockUserId } from '../mock-backend/session';
import { MOCK_USERS } from '../mock-backend/users';
import { getCurrentSubscriptionSummary } from './billing';

const MOCK_DELAY = 150;

function wait(ms = MOCK_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCurrentProfile() {
  await wait();

  // TODO: Replace with http.get('/profile/me').
  const userId = await getMockUserId();
  const user = MOCK_USERS.find(item => item.id === userId) ?? MOCK_USERS[0];
  const subscription = await getCurrentSubscriptionSummary(user.id);

  const { password: _password, ...safeUser } = user;

  return {
    ...safeUser,
    subscription,
    subscriptionLabel: subscription.planName,
    subscriptionStatus: subscription.statusLabel,
    subscriptionPriceLabel: subscription.priceLabel,
  };
}

export async function updateProfile(data) {
  await wait();

  // TODO: Replace with http.put('/profile/me', data).
  const userId = await getMockUserId();
  const user = MOCK_USERS.find(item => item.id === userId) ?? MOCK_USERS[0];
  const { password: _password, ...safeUser } = user;
  return { ...safeUser, ...data };
}
