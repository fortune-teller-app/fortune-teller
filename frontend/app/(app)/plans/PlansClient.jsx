'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '../../../components/decorations';
import styles from './plans.module.css';

export default function PlansClient({ plans, currentSubscription }) {
  const [selected, setSelected] = useState(currentSubscription.planId);

  return (
    <div className="screen-fade">
      <div className="content-wrap-narrow">

        <header className={`app-header ${styles.header}`}>
          <div className={styles.headerSpacer} />
          <h2>Plans</h2>
          <div className="right">
            <button className="icon-btn" aria-label="Close">
              <Icon name="x" size={14} />
            </button>
          </div>
        </header>

        <div className={`section ${styles.heroSection}`}>
          <div className={styles.heroDiamond}>
            <Icon name="diamond" size={28} color="var(--gold)" />
          </div>
          <div className="eyebrow">Membership</div>
          <h1 className={`serif ${styles.heroTitle}`}>
            Choose your <em className="serif-i gold">plan.</em>
          </h1>
          <p className={`mute ${styles.heroSub}`}>
            One simple plan. Cancel anytime, your readings stay saved.
          </p>
        </div>

        <div className="section">
          <Link
            href="/current-plan"
            className={`card ${styles.bannerCard}`}
          >
            <div className={styles.bannerIcon}>
              <Icon name="diamond" size={14} color="var(--on-gold)" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={styles.bannerActive}>Current plan</div>
              <div className={`serif ${styles.bannerName}`}>
                {currentSubscription.planName} · view current plan
              </div>
            </div>
            <Icon name="chevron" size={14} color="var(--gold)" />
          </Link>
        </div>

        <div className={`section ${styles.plansList}`}>
          {plans.map(p => (
            <button
              key={p.id}
              className={`card ${styles.planCard} ${selected === p.id ? styles.planSelected : ''}`}
              onClick={() => setSelected(p.id)}
            >
              <div className={styles.planLeft}>
                <div>
                  <div className={`muter ${styles.planName}`}>{p.name}</div>
                  <div className={`serif-i ${styles.planBlurb} ${selected === p.id ? styles.planBlurbActive : ''}`}>
                    {p.blurb}
                  </div>
                </div>
                <div className={styles.planFeatures}>
                  {p.features.map(f => (
                    <div key={f} className={styles.featureItem}>
                      <Icon name="check" size={12} color="var(--gold)" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.planRight}>
                {p.featured && (
                  <span className={`badge ${styles.featuredBadge}`}>
                    <span className="dot-gold" />
                    {p.badgeLabel}
                  </span>
                )}
                <div className={`serif ${styles.planPrice}`}>{p.price}</div>
                {p.cadence && <div className={`muter ${styles.planCadence}`}>{p.cadence}</div>}
              </div>
            </button>
          ))}
        </div>

        <div className={`section ${styles.ctaSection}`}>
          <button className="btn btn-gold btn-block">
            Start your plan
            <Icon name="chevron" size={14} color="var(--on-gold)" />
          </button>
          <div className={styles.ctaFooter}>Restore purchase · Privacy</div>
        </div>

      </div>
    </div>
  );
}
