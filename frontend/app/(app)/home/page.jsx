import Link from 'next/link';
import { Icon } from '../../../components/decorations';
import { getAuthenticatedUser } from '../../../lib/api/auth';
import { getLatestReadings } from '../../../lib/api/readings';
import GreetingClient from './GreetingClient';
import styles from './home.module.css';

const PRACTICES = [
  { id: 'tarot',  name: 'Tarot',     sub: 'Three cards · past, present, path', icon: 'moon',    featured: true, route: '/tarot'     },
  { id: 'palm',   name: 'Palmistry', sub: 'Lines of the hand',                 icon: 'hand',    route: '/palmistry' },
  { id: 'astro',  name: 'Astrology', sub: 'Natal & transit',                   icon: 'sparkle', route: '/astrology' },
  { id: 'dream',  name: 'Dream',     sub: 'Nocturne ledger',                   icon: 'book',    route: '/dream'     },
  { id: 'daily',  name: 'Horoscope', sub: 'Reveal of the day',                 icon: 'sun',     route: '/daily'     },
];


const r4 = (n) => Number(n.toFixed(4));

function formatRecentSub(reading) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(reading.createdAt));

  return `${weekday} · ${reading.practiceLabel}`;
}

function FeaturedCardDecoration() {
  return (
    <>
      <div className={styles.featuredGlow} />
      <svg className={styles.featuredSvg} viewBox="-120 -120 240 240" aria-hidden="true">
        <circle r="104" fill="none" stroke="var(--gold)" strokeWidth="0.4" />
        <circle r="72"  fill="none" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="2 4" />
        <circle r="42"  fill="none" stroke="var(--gold)" strokeWidth="0.4" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={r4(Math.cos(a) * 92)} y1={r4(Math.sin(a) * 92)}
              x2={r4(Math.cos(a) * 104)} y2={r4(Math.sin(a) * 104)}
              stroke="var(--gold)" strokeWidth="0.4"
            />
          );
        })}
      </svg>
    </>
  );
}

export default async function Dashboard() {
  const [user, recentReadings] = await Promise.all([
    getAuthenticatedUser(),
    getLatestReadings({ limit: 3 }),
  ]);
  const firstName = user?.name?.trim().split(' ')[0] || 'Seeker';

  return (
    <div className={`screen-fade ${styles.screen}`}>

      <header className={`app-header ${styles.header}`}>
        <div className={styles.headerInner}>
          <div />
          <div className="flex items-center gap-2">
            <Icon
              name="logo"
              size={22}
              color="var(--gold)"
              style={{ width: 'var(--home-logo-size)', height: 'var(--home-logo-size)' }}
            />
            <span className={`serif ${styles.brandName}`}>FT</span>
          </div>
          <div className="right">
            <button className={`icon-btn ${styles.bellBtn}`} aria-label="Notifications">
              <Icon name="bell" size={18} />
              <span className={styles.notifDot} />
            </button>
          </div>
        </div>
      </header>

      <div className="content-wrap">

        <GreetingClient firstName={firstName} />

        <div className={`section ${styles.practiceSection}`}>
          <div className="section-h">
            <h3>Practices</h3>
          </div>

          <div className={styles.practiceGrid}>
            {PRACTICES.map(p => (
              <Link
                key={p.id}
                href={p.route}
                className={`card ${styles.practiceCard} ${p.featured ? styles.practiceCardFeatured : ''}`}
              >
                {p.featured && <FeaturedCardDecoration />}

                <div className="flex items-center justify-between relative z-[1]">
                  <span className={`icon-circle w-[38px] h-[38px] lg:w-11 lg:h-11 ${styles.practiceIcon}`}>
                    <Icon
                      name={p.icon}
                      size={20}
                      color="var(--gold)"
                      style={{ width: 'var(--home-practice-icon-size)', height: 'var(--home-practice-icon-size)' }}
                    />
                  </span>
                  {p.featured && (
                    <span className="badge">
                      <span className="dot-gold" />
                      Featured
                    </span>
                  )}
                </div>

                <div className={`relative z-[1] ${p.featured ? styles.featuredTextWrap : styles.practiceTextWrap}`}>
                  <h4 className={`serif ${styles.practiceName} ${p.featured ? styles.practiceNameFeatured : ''}`}>
                    {p.name}
                  </h4>
                  <div className={`muter ${styles.practiceSub}`}>{p.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {recentReadings.length > 0 && (
        <div className={`section ${styles.recentSection}`}>
          <div className="section-h">
            <h3>Recent</h3>
            <Link className={styles.sectionLink} href="/history">
              Ledger
            </Link>
          </div>

          <div className={styles.recentList}>
            {recentReadings.map((reading) => (
              <button
                key={reading.id}
                type="button"
                className={`card flex items-center ${styles.recentCard}`}
              >
                <span className="icon-circle w-9 h-9 lg:w-11 lg:h-11 flex-shrink-0">
                  <Icon
                    name={reading.icon}
                    size={18}
                    color="var(--gold)"
                    style={{ width: 'var(--home-recent-icon-size)', height: 'var(--home-recent-icon-size)' }}
                  />
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`serif ${styles.recentTitle}`}>{reading.title}</div>
                  <div className={`muter ${styles.recentSub}`}>{formatRecentSub(reading)}</div>
                </div>
                <Icon name="chevron" size={14} color="var(--ink-3)" />
              </button>
            ))}
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
