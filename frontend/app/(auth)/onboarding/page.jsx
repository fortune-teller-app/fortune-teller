'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '../../../components/decorations';
import AuthLayout from '../../../components/layout/AuthLayout/AuthLayout';
import { MandalaIcon } from '../../../components/ui';
import styles from './onboarding.module.css';

const STEPS = [
  {
    eyebrow: 'Birth Chart',
    title: 'Anchor your sky.',
    body: 'We chart your natal moment — the celestial fingerprint that guides every reading.',
  },
  {
    eyebrow: 'Daily Rite',
    title: 'A single card,\nevery dawn.',
    body: 'One quiet ritual a day. The oracle finds you wherever you are.',
  },
  {
    eyebrow: 'Private Ledger',
    title: 'Yours alone.',
    body: 'Readings, dreams, and notes — sealed, searchable, and never shared.',
  },
];

export default function Onboarding() {
  // Shown after successful registration; this static walkthrough does not collect backend data yet.
  const router = useRouter();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  function advance() {
    if (isLast) router.push('/home');
    else setStep(prev => prev + 1);
  }

  return (
    <AuthLayout seed={9} orbits="low">
      <nav className="flex items-center justify-between px-6 pt-2 lg:px-14 lg:pt-7">
        <div className="dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <Link href="/home" className={`muter ${styles.skipLink}`}>Skip</Link>
      </nav>

      <div className="flex-1 flex flex-col justify-center px-7 lg:max-w-[720px] lg:mx-auto lg:w-full lg:px-14 lg:flex-none lg:justify-start lg:pt-6">

        <MandalaIcon
          size={220} desktopSize={320}
          float
          className={styles.mandalaWrap}
        />

        <div className={`text-center ${styles.textWrap}`}>
          <span className="eyebrow">{current.eyebrow}</span>
          <h1 className={`serif ${styles.headline}`}>{current.title}</h1>
          <p className={`mute ${styles.subtext}`}>{current.body}</p>
        </div>

        <div className="mt-11 flex justify-center pb-9 lg:pb-10">
          <button className={`btn btn-gold ${styles.ctaBtn}`} onClick={advance}>
            {isLast ? 'Begin' : 'Next'}
            <Icon name="chevron" size={14} color="var(--on-gold)" />
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
