'use client';

import { useMemo, useState } from 'react';
import { Icon } from '../../../components/decorations';
import styles from './history.module.css';

const FILTERS = ['all', 'tarot', 'palmistry', 'astrology', 'dream', 'daily'];

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
}

function groupLabel(date) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const key = date.toISOString().slice(0, 10);

  if (key === todayKey) return 'Today';
  if (key === yesterdayKey) return 'Yesterday';
  return 'This week';
}

function groupReadings(readings) {
  return readings.reduce((groups, reading) => {
    const date = new Date(reading.createdAt);
    const label = groupLabel(date);
    const current = groups.find(group => group.day === label);
    const item = {
      ...reading,
      displayTime: formatTime(date),
      displayTag: reading.tags?.[0] ?? 'Reading',
    };

    if (current) current.list.push(item);
    else groups.push({ day: label, list: [item] });

    return groups;
  }, []);
}

export default function HistoryClient({ readings, total, practiceMeta }) {
  const [filter, setFilter] = useState('all');

  const filteredReadings = useMemo(() => (
    filter === 'all' ? readings : readings.filter(reading => reading.practice === filter)
  ), [filter, readings]);

  const groups = useMemo(() => groupReadings(filteredReadings), [filteredReadings]);

  return (
    <div className="screen-fade">
      <div className="content-wrap">

        <header className={`app-header ${styles.header}`}>
          <div className="left" />
          <h2>Ledger</h2>
          <div className="right" />
        </header>

        <div className={`section ${styles.statSection}`}>
          <p className={styles.statParagraph}>
            <span className={`serif-i ${styles.statNumber}`}>{total} </span>
            <span className={`serif ${styles.statLabel}`}>readings, kept.</span>
          </p>
        </div>

        <div className={`section ${styles.filterSection}`}>
          <div className={styles.filterRow}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.chip} ${filter === f ? styles.chipActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {practiceMeta[f]?.label ?? f}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="section">
            <div className={`card ${styles.groupCard}`}>
              <div className={styles.entryRow}>
                <div className="flex-1 min-w-0">
                  <div className={`serif ${styles.entryTitle}`}>No readings kept yet</div>
                  <div className={`muter ${styles.entrySub}`}>Choose a practice to begin</div>
                </div>
              </div>
            </div>
          </div>
        ) : groups.map((group) => (
          <div className="section" key={group.day}>
            <div className={`section-h ${styles.groupHeader}`}>
              <h3 className={styles.groupDay}>{group.day}</h3>
              <span className={`muter ${styles.groupCount}`}>{group.list.length}</span>
            </div>

            <div className={`card ${styles.groupCard}`}>
              {group.list.map((it, i) => (
                <div
                  key={it.id}
                  className={`${styles.entryRow} ${i > 0 ? styles.entryBorder : ''}`}
                >
                  <span className="icon-circle w-9 h-9 lg:w-10 lg:h-10 flex-shrink-0">
                    <Icon name={it.icon} size={15} color="var(--gold)" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className={`serif ${styles.entryTitle}`}>{it.title}</div>
                    <div className={`muter ${styles.entrySub}`}>{it.practiceLabel} · {it.displayTag}</div>
                  </div>

                  <div className={`muter ${styles.entryMeta}`}>{it.practiceLabel} · {it.displayTag}</div>
                  <div className={`serif-i ${styles.entryTime}`}>{it.displayTime}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
