'use client';

import styles from './Toggle.module.css';

export default function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`${styles.track} ${on ? styles.on : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className={`${styles.thumb} ${on ? styles.thumbOn : ''}`} />
    </button>
  );
}
