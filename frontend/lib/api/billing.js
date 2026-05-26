import { MOCK_PLANS, MOCK_SUBSCRIPTIONS } from '../mock-backend/billing';
import { getMockUserId } from '../mock-backend/session';

const MOCK_DELAY = 150;

function wait(ms = MOCK_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPlan(planId) {
  return MOCK_PLANS.find(plan => plan.id === planId) ?? MOCK_PLANS[0];
}

function findSubscription(userId) {
  return MOCK_SUBSCRIPTIONS.find(sub => sub.userId === userId)
    ?? MOCK_SUBSCRIPTIONS.find(sub => sub.userId === 'user_liora');
}

function toSubscriptionSummary(subscription) {
  const plan = getPlan(subscription.planId);
  const priceLabel = plan.cadence ? `${plan.price} ${plan.cadence}` : plan.price;

  return {
    id: subscription.id,
    userId: subscription.userId,
    planId: plan.id,
    planName: plan.name,
    planBlurb: plan.blurb,
    status: subscription.status,
    statusLabel: subscription.statusLabel,
    price: plan.price,
    cadence: plan.cadence,
    priceLabel,
    startedAt: subscription.startedAt,
    renewsAt: subscription.renewsAt,
    paymentSummary: subscription.paymentSummary,
    benefits: plan.features,
    featured: plan.featured,
  };
}

export async function getPlans() {
  await wait();

  // TODO: Replace with http.get('/billing/plans').
  return MOCK_PLANS;
}

export async function getCurrentSubscription(userId) {
  await wait();

  // TODO: Replace with http.get('/billing/subscription').
  const resolvedId = userId ?? await getMockUserId();
  return toSubscriptionSummary(findSubscription(resolvedId));
}

export async function getCurrentSubscriptionSummary(userId) {
  const resolvedId = userId ?? await getMockUserId();
  return toSubscriptionSummary(findSubscription(resolvedId));
}

export async function changePlan(planId) {
  await wait();

  // TODO: Replace with http.put('/billing/subscription', { planId }).
  const plan = getPlan(planId);
  return { ok: true, planId: plan.id };
}

export async function cancelPlan() {
  await wait();

  // TODO: Replace with http.delete('/billing/subscription').
  return { ok: true, cancelled: true };
}
