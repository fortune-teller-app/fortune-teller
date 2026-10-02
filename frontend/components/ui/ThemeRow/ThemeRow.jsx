'use client';

import { Icon } from '../../decorations';
import { useTheme } from '../../theme/ThemeProvider';
import styles from './ThemeRow.module.css';

const OPTIONS = [
  { value: 'light',  label: 'Light'  },
  { value: 'dark',   label: 'Dark'   },
  { value: 'system', label: 'System' },
];

export default function ThemeRow() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const description =
    preference === 'system'
      ? `Matches your device (currently ${resolvedTheme})`
      : preference === 'light'
        ? 'Bright, high-contrast'
        : 'Noctua night sky';

  return (
    <fieldset className={styles.row}>
      <legend className="sr-only">Theme</legend>

      <div className={styles.head}>
        <span className="icon-circle w-8 h-8 lg:w-9 lg:h-9">
          <Icon name={resolvedTheme === 'light' ? 'sun' : 'moon'} size={15} color="var(--gold)" />
        </span>
        <div className="flex-1">
          <div className={`serif ${styles.label}`}>Theme</div>
          <div className={`muter ${styles.value}`}>{description}</div>
        </div>
      </div>

      <div className={styles.segments}>
        {OPTIONS.map(({ value, label }) => (
          <label key={value} className={styles.segment}>
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => setPreference(value)}
              className={styles.input}
            />
            <span className={styles.face}>
              {preference === value && <Icon name="check" size={13} color="currentColor" strokeWidth={2} />}
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
