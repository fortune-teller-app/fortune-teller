'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '../../../components/decorations';
import AuthLayout from '../../../components/layout/AuthLayout/AuthLayout';
import { MandalaIcon, Checkbox, PasswordField } from '../../../components/ui';
import { registerUser } from '../../../lib/api/auth';
import styles from './register.module.css';

const STEPS = [
  {
    eyebrow: 'Rite of Passage · I',
    titleLine1: 'How shall the',
    titleGold: 'stars call you?',
    sub: 'A name only. No surnames, no titles, unless you wish to be known by them.',
    icon: 'spark',
  },
  {
    eyebrow: 'Rite of Passage · II',
    titleLine1: 'When did you',
    titleGold: 'first draw breath?',
    sub: 'Your natal moment anchors every reading. The hour shapes your rising — leave it blank if unknown.',
    icon: 'calendar',
  },
  {
    eyebrow: 'Rite of Passage · III',
    titleLine1: 'Where did your',
    titleGold: 'sky begin?',
    sub: "The city or town of your first breath. Skip if uncertain — we'll use a solar chart instead.",
    icon: 'globe',
  },
  {
    eyebrow: 'Rite of Passage · IV',
    titleLine1: 'Where shall we send',
    titleGold: 'your omens?',
    sub: 'A quiet inbox is best. We send one signal a day, never more — and never the kind that begs to be opened.',
    icon: 'mail',
  },
  {
    eyebrow: 'Rite of Passage · V',
    titleLine1: 'Seal your',
    titleGold: 'oath.',
    sub: "A passphrase known only to you. Eight characters minimum — the longer, the truer.",
    icon: 'lock',
  },
];

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    name: '', birthDate: '', birthTime: '', birthPlace: '', email: '', passphrase: '',
  });

  function setField(key, value) {
    setData(d => ({ ...d, [key]: value }));
  }

  const canNext = [
    data.name.trim().length > 0,
    data.birthDate.trim().length > 0,
    true,
    data.email.includes('@'),
    data.passphrase.length >= 8 && acceptedTerms,
  ][step];

  const isLast = step === STEPS.length - 1;

  async function next() {
    if (!canNext || loading) return;
    setError('');

    if (isLast) {
      setLoading(true);
      try {
        await registerUser({
          name: data.name,
          birthDate: data.birthDate,
          birthTime: data.birthTime,
          birthPlace: data.birthPlace,
          email: data.email,
          password: data.passphrase,
        });
        router.push('/onboarding');
      } catch (err) {
        setError(err.message || 'Unable to complete registration. Try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  }

  function prev() {
    if (loading) return;
    if (step === 0) router.push('/');
    else setStep(s => s - 1);
  }

  return (
    <AuthLayout seed={5} orbits="low">
      <nav className="flex items-center justify-between px-6 pt-2 lg:px-14 lg:pt-7">
        <button className="icon-btn" onClick={prev} aria-label="Back">
          <Icon name="back" size={16} />
        </button>

        <div className="dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>

        <Link href="/login" className={`muter ${styles.signInLink}`}>Sign in</Link>
      </nav>

      <div className="flex-1 relative overflow-hidden lg:max-w-[720px] lg:mx-auto lg:w-full">
        <div className={styles.slideTrack} data-step={step}>
          {STEPS.map((stp, i) => (
            <div key={i} className={styles.slide}>

              <MandalaIcon
                icon={stp.icon}
                size={140} desktopSize={200}
                iconSize={22} iconDesktopSize={28}
                animate={i === step}
                float
                className={styles.mandalaWrap}
              />

              <div className="text-center">
                <span className="eyebrow">{stp.eyebrow}</span>
                <h1 className={`serif ${styles.headline}`}>
                  {stp.titleLine1}<br />
                  <em className="serif-i gold">{stp.titleGold}</em>
                </h1>
                <p className={`mute ${styles.subtext}`}>{stp.sub}</p>
              </div>

              <div className={styles.fields}>
                {i === 0 && (
                  <div className="field">
                    <span className="field-label">Name</span>
                    <input
                      type="text"
                      value={data.name}
                      onChange={e => setField('name', e.target.value)}
                    />
                  </div>
                )}

                {i === 1 && (
                  <>
                    <div className="field">
                      <span className="field-label">Date of birth</span>
                      <input
                        type="date"
                        value={data.birthDate}
                        onChange={e => setField('birthDate', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <span className="field-label">Hour (optional)</span>
                      <input
                        type="time"
                        value={data.birthTime}
                        onChange={e => setField('birthTime', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {i === 2 && (
                  <div className="field">
                    <span className="field-label">Place (optional)</span>
                    <input
                      type="text"
                      value={data.birthPlace}
                      onChange={e => setField('birthPlace', e.target.value)}
                    />
                  </div>
                )}

                {i === 3 && (
                  <div className="field">
                    <span className="field-label">Email</span>
                    <input
                      type="email"
                      value={data.email}
                      onChange={e => setField('email', e.target.value)}
                    />
                  </div>
                )}

                {i === 4 && (
                  <PasswordField
                    value={data.passphrase}
                    onChange={e => setField('passphrase', e.target.value)}
                  />
                )}
              </div>

              {i === 0 && (
                <div className={styles.quoteWrap}>
                  <p className={`serif-i ${styles.quote}`}>
                    "Names are the first omens we wear."
                  </p>
                </div>
              )}

              {i === 4 && (
                <Checkbox
                  checked={acceptedTerms}
                  onChange={setAcceptedTerms}
                  className={styles.termsRow}
                >
                  I accept the{' '}
                  <span className="gold">Oath of the Seeker</span>
                  {' '}and Terms.
                </Checkbox>
              )}

            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pt-5 pb-9 lg:gap-[14px] lg:px-14 lg:max-w-[720px] lg:mx-auto lg:w-full">
        <button className={`icon-btn ${styles.prevBtn}`} onClick={prev} aria-label="Previous step">
          <Icon name="back" size={16} />
        </button>
        <div className={styles.ctaWrap}>
          {error && <p className={`mute ${styles.errorText}`}>{error}</p>}
          <button
            className={`btn btn-gold ${styles.ctaBtn}`}
            onClick={next}
            disabled={!canNext || loading}
          >
            {loading ? 'Sealing...' : isLast ? 'Seal the rite' : 'Continue'}
            <Icon name="chevron" size={14} color="var(--on-gold)" />
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
