'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '../../../components/decorations';
import AuthLayout from '../../../components/layout/AuthLayout/AuthLayout';
import { MandalaIcon, Checkbox, PasswordField } from '../../../components/ui';
import { loginUser } from '../../../lib/api/auth';
import styles from './login.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitLogin() {
    setLoading(true);
    setError('');

    try {
      await loginUser({ email, password: passphrase, remember });
      router.push('/home');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout seed={3} orbits="low">
      <nav className="flex items-center justify-between px-6 pt-2 lg:px-14 lg:pt-7">
        <Link href="/" className="icon-btn" aria-label="Back">
          <Icon name="back" size={16} />
        </Link>
        <Link href="/" className={`muter ${styles.returnLabel}`}>Return</Link>
      </nav>

      <div className="flex-1 flex flex-col justify-center px-7 lg:max-w-[720px] lg:mx-auto lg:w-full lg:px-14 lg:flex-none lg:justify-start lg:pt-3">

        <MandalaIcon size={170} desktopSize={240} className="mb-6 lg:mb-0 lg:mt-2" />

        <div className={`text-center ${styles.headingWrap}`}>
          <span className="eyebrow">Welcome back</span>
          <h1 className={`serif ${styles.headline}`}>
            The night<br />
            <em className="serif-i gold">remembers you.</em>
          </h1>
        </div>

        <div className={styles.fields}>
          <div className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <PasswordField
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
          />
        </div>

        <div className={`flex items-center justify-between ${styles.rememberRow}`}>
          <Checkbox checked={remember} onChange={setRemember}>Remember</Checkbox>
          <Link href="/forgot-password" className={styles.forgotLink}>
            Forgot passphrase?
          </Link>
        </div>

        <div className="mt-8 lg:mt-12 pb-6 lg:pb-10">
          {error && <p className={`mute ${styles.errorText}`}>{error}</p>}

          <button
            className="btn btn-gold btn-block"
            onClick={submitLogin}
            disabled={loading}
          >
            {loading ? 'Entering...' : 'Enter'}
            <Icon name="chevron" size={14} color="var(--on-gold)" />
          </button>

          <div className={styles.divider}>
            <div className="hair-soft" />
            <span className={styles.orText}>or</span>
            <div className="hair-soft" />
          </div>

          <button className="btn btn-ghost btn-block">Continue with Apple</button>
          <button className="btn btn-ghost btn-block mt-3">Continue with Google</button>
        </div>

      </div>
    </AuthLayout>
  );
}
