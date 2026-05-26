import Link from 'next/link';
import { Icon, Mandala } from '../../../components/decorations';
import { BackButton } from '../../../components/ui';
import { getCurrentSubscription } from '../../../lib/api/billing';
import styles from './current-plan.module.css';

function formatDate(date) {
  if (!date) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

export default async function CurrentPlan() {
  const subscription = await getCurrentSubscription();
  const isFree = subscription.status === 'free';

  return (
    <div className="screen-fade">
      <div className="content-wrap-narrow">

        <header className={`app-header ${styles.header}`}>
          <div className="left">
            <BackButton />
          </div>
          <h2>Membership</h2>
          <div className={styles.headerSpacer} />
        </header>

        <div className={`section ${styles.heroSection}`}>
          <div className={styles.mandalaWrap}>
            <Mandala size={150} animate />
            <div className={styles.diamondCircle}>
              <Icon name="diamond" size={22} color="var(--on-gold)" strokeWidth={1.6} />
            </div>
          </div>

          <div className="eyebrow">Current plan</div>

          <h1 className={`serif ${styles.heroTitle}`}>
            Your <em className="serif-i gold">{subscription.planName}</em><br />
            plan is {isFree ? 'ready.' : 'active.'}
          </h1>

          <p className={`mute ${styles.heroSub}`}>
            Started on {formatDate(subscription.startedAt)}. {isFree ? 'Upgrade anytime when you want more depth.' : 'Cancel anytime, your readings stay saved.'}
          </p>
        </div>

        <div className={`section ${styles.planSection}`}>
          <div className={`card ${styles.planCard}`}>
            <div className={styles.planTop}>
              <div>
                <div className={`muter ${styles.planName}`}>{subscription.planName}</div>
                <div className={`serif-i ${styles.planBlurb}`}>{subscription.planBlurb}</div>
              </div>
              <div className={styles.planPriceWrap}>
                <div className={`serif ${styles.planPrice}`}>{subscription.price}</div>
                {subscription.cadence && <div className={`muter ${styles.planCadence}`}>{subscription.cadence}</div>}
              </div>
            </div>

            <div className={`hair-soft ${styles.planDivider}`} />

            <div className={styles.renewalGrid}>
              <div>
                <div className={`muter ${styles.renewLabel}`}>Renews</div>
                <div className={`serif ${styles.renewValue}`}>{formatDate(subscription.renewsAt)}</div>
              </div>
              <div>
                <div className={`muter ${styles.renewLabel}`}>Payment</div>
                <div className={`serif ${styles.renewValue}`}>{subscription.paymentSummary}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className={`section-h ${styles.sectionHeader}`}>
            <h3>Plan benefits</h3>
          </div>

          <div className={`card ${styles.benefitsCard}`}>
            {subscription.benefits.map((f, i, arr) => (
              <div
                key={f}
                className={`
                  ${styles.benefitRow}
                  ${i === 0 ? styles.benefitFirst : ''}
                  ${i === arr.length - 1 ? styles.benefitLast : ''}
                `}
              >
                <Icon name="check" size={14} color="var(--gold)" />
                <span className={styles.benefitText}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`section ${styles.ctaSection}`}>
          <Link className="btn btn-gold btn-block" href="/plans">
            Change plan
            <Icon name="chevron" size={14} color="var(--on-gold)" />
          </Link>
          <button className={`btn btn-ghost btn-block ${styles.cancelBtn}`}>
            {isFree ? 'Keep free plan' : 'Cancel membership'}
          </button>
          <div className={styles.ctaNote}>
            {isFree ? 'Free plan · readings stay saved' : 'Cancel anytime · readings stay saved'}
          </div>
        </div>

      </div>
    </div>
  );
}
