import Link from 'next/link';
import { Icon, Mandala, Moon, StarField, OrbitRings } from '../components/decorations';
import styles from './landing.module.css';

const PRACTICES = [
  { ic: 'moon',    label: 'Tarot' },
  { ic: 'hand',    label: 'Palm' },
  { ic: 'sparkle', label: 'Astro' },
  { ic: 'book',    label: 'Dream' },
  { ic: 'sun',     label: 'Daily' },
];

export default function Landing() {
  return (
    <div className={`relative overflow-hidden min-h-screen flex flex-col ${styles.screen}`}>
      <StarField density="med" seed={7} />
      <OrbitRings density="med" />

      <div className="screen-fade relative z-[1] flex-1 flex flex-col">

        <nav className="flex items-center justify-between px-6 pt-8 lg:px-14 lg:pt-7">
          <div className="flex items-center gap-[10px]">
            <Icon name="logo" size={22} color="var(--gold)" />
            <span className={`serif ${styles.brandName}`}>FT</span>
          </div>

          <div className={styles.authLinks}>
            <Link href="/login" className={styles.signIn}>Sign in</Link>
            <Link href="/register" className={styles.signUp}>Sign up</Link>
          </div>
        </nav>

        <div className="flex-1 flex flex-col px-6 lg:max-w-[720px] lg:mx-auto lg:w-full lg:px-14">

          <div className="relative flex justify-center mt-10 lg:mt-3">
            <div className="float">
              <Mandala
                size={380}
                style={{ width: 'var(--landing-mandala-size)', height: 'var(--landing-mandala-size)' }}
              />
            </div>
            <div className={styles.mandalaOverlay}>
              <span className="eyebrow">Anno · MMXXVI</span>
              <Moon
                size={32}
                style={{ width: 'var(--landing-moon-size)', height: 'var(--landing-moon-size)' }}
              />
            </div>
          </div>

          <div className="text-center mt-8 lg:mt-10">
            <h1 className={`serif ${styles.headline}`}>
              The stars are<br />
              <em className="serif-i gold">listening.</em>
            </h1>
            <p className={`mute ${styles.subtext}`}>
              A private oracle for the curious. Five ancient practices, distilled for the modern seeker.
            </p>
          </div>

          <div className={`grid grid-cols-5 mt-9 lg:mt-14 ${styles.practiceGrid}`}>
            {PRACTICES.map((p) => (
              <div key={p.label} className={`card ${styles.practiceCard}`}>
                <Icon
                  name={p.ic}
                  size={22}
                  color="var(--gold)"
                  style={{ width: 'var(--landing-practice-icon-size)', height: 'var(--landing-practice-icon-size)' }}
                />
                <span className={styles.practiceLabel}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.ctaWrap}>
          <Link href="/register" className={`btn btn-gold ${styles.ctaBtn}`}>
            Begin the reading
            <Icon name="chevron" size={14} color="var(--on-gold)" />
          </Link>
          <p className={styles.ctaSupport}>Free to begin · No card required</p>
        </div>

      </div>
    </div>
  );
}
