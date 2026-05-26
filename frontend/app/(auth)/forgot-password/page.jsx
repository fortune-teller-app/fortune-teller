'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '../../../components/decorations';
import AuthLayout from '../../../components/layout/AuthLayout/AuthLayout';
import { MandalaIcon } from '../../../components/ui';
import { forgotPassword } from '../../../lib/api/auth';
import styles from './forgot-password.module.css';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitForgotPassword() {
    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Unable to send reset instructions. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout seed={11} orbits="low">
      <nav className="flex items-center justify-between px-6 pt-2 lg:px-14 lg:pt-7">
        <Link href="/login" className="icon-btn" aria-label="Back">
          <Icon name="back" size={16} />
        </Link>
        <Link href="/login" className={`muter ${styles.returnLabel}`}>Return</Link>
      </nav>

      <div className="flex-1 flex flex-col justify-center px-7 lg:max-w-[720px] lg:mx-auto lg:w-full lg:px-14 lg:flex-none lg:justify-start lg:pt-3">

        <MandalaIcon
          icon={sent ? 'mail' : 'lock'}
          size={170} desktopSize={220}
          iconSize={24} iconDesktopSize={30}
          className={styles.mandalaWrap}
        />

        <div className={`text-center ${styles.headingWrap}`}>
          <span className="eyebrow">{sent ? 'Signal sent' : 'Forgot the rite'}</span>

          {!sent ? (
            <h1 className={`serif ${styles.headline}`}>
              The night<br />
              <em className="serif-i gold">can remind you.</em>
            </h1>
          ) : (
            <h1 className={`serif ${styles.headline}`}>
              We&apos;ve sent a<br />
              <em className="serif-i gold">signal.</em>
            </h1>
          )}

          <p className={`mute ${styles.subtext}`}>
            {sent ? (
              <>
                Open the message in your inbox to{' '}
                <span className={styles.inkHighlight}>seal a new passphrase</span>.
                The link fades at midnight.
              </>
            ) : (
              <>
                Tell us the email you sealed your oath with.
                We&apos;ll send a signal to your inbox.
              </>
            )}
          </p>
        </div>

        {!sent && (
          <div className={styles.fields}>
            <div className="field">
              <span className="field-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@inbox.com"
              />
            </div>
          </div>
        )}

        {sent && (
          <div className={`fade-up ${styles.confirmWrap}`}>
            <div className={`card ${styles.confirmCard}`}>
              <span className="icon-circle w-9 h-9 lg:w-11 lg:h-11">
                <Icon name="mail" size={15} color="var(--gold)" />
              </span>

              <div className={styles.confirmEmail}>
                <span className={styles.sentToLabel}>Sent to</span>
                <span className={`serif ${styles.sentToValue}`}>
                  {email || 'your@inbox.com'}
                </span>
              </div>
            </div>

            <div className={styles.tryAgainRow}>
              No signal?{' '}
              <button onClick={() => setSent(false)} className={styles.goldBtn}>
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 lg:mt-12 pb-6 lg:pb-10">
          {!sent ? (
            <>
              {error && <p className={`mute ${styles.errorText}`}>{error}</p>}
              <button
                className="btn btn-gold btn-block"
                onClick={submitForgotPassword}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send the signal'}
                <Icon name="chevron" size={14} color="var(--on-gold)" />
              </button>
              <p className={styles.rememberRow}>
                Remembered it?{' '}
                <Link href="/login" className={styles.goldLink}>Sign in</Link>
              </p>
            </>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-block">
              Return to sign in
            </Link>
          )}
        </div>

      </div>
    </AuthLayout>
  );
}
