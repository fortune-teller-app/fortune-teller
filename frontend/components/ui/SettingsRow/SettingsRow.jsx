import { Children } from 'react';
import { Icon } from '../../decorations';
import styles from './SettingsRow.module.css';

export function SettingsRow({ icon, label, value, danger, onClick, disabled }) {
  return (
    <button
      className={`
        ${styles.row}
        ${danger ? styles.rowDanger : ''}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={`icon-circle w-8 h-8 lg:w-9 lg:h-9 ${danger ? styles.iconDanger : ''}`}>
        <Icon
          name={icon}
          size={14}
          color={danger ? 'var(--danger)' : 'var(--gold)'}
        />
      </span>

      <div className="flex-1">
        <div className={`serif ${styles.label}`}>{label}</div>
        {value && <div className={`muter ${styles.value}`}>{value}</div>}
      </div>

      <Icon name="chevron" size={14} color="var(--ink-3)" />
    </button>
  );
}

export function SettingsGroup({ title, children }) {
  return (
    <div className="section">
      <div className={`muter ${styles.groupTitle}`}>{title}</div>
      <div className={`card ${styles.groupCard}`}>
        {Children.map(children, (child, i) => (
          <div key={i} className={i > 0 ? styles.divider : ''}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
