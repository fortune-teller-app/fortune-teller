'use client';

import { Icon } from '../../decorations';
import styles from './Checkbox.module.css';

export default function Checkbox({ checked, onChange, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center text-left ${styles.root} ${className}`}
      aria-pressed={checked}
    >
      <span className={styles.box}>
        {checked && <Icon name="check" size={12} color="var(--gold)" />}
      </span>
      {children && <span className={styles.label}>{children}</span>}
    </button>
  );
}
