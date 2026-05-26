import { getCurrentSubscription, getPlans } from '../../../lib/api/billing';
import PlansClient from './PlansClient';

export default async function Plans() {
  const [plans, currentSubscription] = await Promise.all([
    getPlans(),
    getCurrentSubscription(),
  ]);

  return (
    <PlansClient
      plans={plans}
      currentSubscription={currentSubscription}
    />
  );
}
