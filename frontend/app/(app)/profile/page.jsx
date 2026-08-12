import Link from 'next/link';
import { Icon, Mandala, Star } from '../../../components/decorations';
import { getCurrentProfile } from '../../../lib/api/profile';
import { getReadingStats } from '../../../lib/api/readings';
import styles from './profile.module.css';

function formatBirthDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

export default async function Profile() {
  const [profile, stats] = await Promise.all([
    getCurrentProfile(),
    getReadingStats(),
  ]);
  const birthInfo = `${profile.roleLabel} · ${formatBirthDate(profile.birthDate)}`;
  const subscriptionText = `${profile.subscriptionStatus} · ${profile.subscriptionPriceLabel}`;
  const statItems = [
    { n: String(stats.totalReadings), l: 'Readings' },
    { n: String(stats.dreamCount), l: 'Dreams' },
    { n: String(stats.daysKept), l: 'Days kept' },
  ];

  return (
    <div className="screen-fade">
      <div className="content-wrap">

        <header className={`app-header ${styles.header}`}>
          <div className="left" />
          <h2>Self</h2>
          <div className="right">
            <Link href="/settings" className="icon-btn" aria-label="Settings">
              <Icon name="settings" size={14} />
            </Link>
          </div>
        </header>

        <div className={`section ${styles.identitySection}`}>
          <div className={styles.identity}>
            <div className={styles.avatarWrap}>
              <Mandala size={120} animate={false} style={{ width: '100%', height: '100%' }} />
              <div className={styles.avatarInner}>
                <span className={`serif ${styles.avatarLetter}`}>{profile.avatarInitial}</span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className={`serif ${styles.name}`}>{profile.fullName}</h2>
              <div className={`muter ${styles.birthInfo}`}>{birthInfo}</div>
              <div className={styles.badges}>
                <span className="badge">
                  <Star size={10} filled />
                  {profile.sunSign}
                </span>
                <span className="badge">{profile.risingSign} ↑</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className={`card ${styles.statsCard}`}>
            {statItems.map((s, i) => (
              <div key={s.l} className={`${styles.stat} ${i > 0 ? styles.statBorder : ''}`}>
                <div className={`serif ${styles.statNumber}`}>{s.n}</div>
                <div className={`muter ${styles.statLabel}`}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-h">
            <h3>Most read</h3>
          </div>

          <div className={`card ${styles.readCard}`}>
            {stats.mostRead.length === 0 ? (
              <div className={`muter ${styles.readEmpty}`}>No readings yet — your practice history will appear here.</div>
            ) : (
              stats.mostRead.map((r, i) => (
                <div key={r.practice} className={`${styles.readRow} ${i > 0 ? styles.readBorder : ''}`}>
                  <span className="icon-circle w-8 h-8 lg:w-10 lg:h-10">
                    <Icon name={r.icon} size={14} color="var(--gold)" />
                  </span>

                  <div className="flex-1">
                    <div className={`serif ${styles.readName}`}>{r.label}</div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>

                  <div className={`serif-i ${styles.readCount}`}>{r.count}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`section ${styles.memberSection}`}>
          <Link
            href="/current-plan"
            className={`card card-bordered ${styles.memberCard}`}
          >
            <div className={styles.memberIcon}>
              <Icon name="diamond" size={16} color="var(--on-gold)" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <div className={`serif ${styles.memberName}`}>{profile.subscriptionLabel}</div>
              <div className={`muter ${styles.memberSub}`}>{subscriptionText}</div>
            </div>
            <Icon name="chevron" size={16} color="var(--ink-2)" />
          </Link>
        </div>

      </div>
    </div>
  );
}
