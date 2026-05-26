'use client';

import { useState } from 'react';
import { Icon } from '../../../components/decorations';
import { updatePreference } from '../../../lib/api/preferences';
import Toggle from '../../../components/ui/Toggle/Toggle';
import styles from '../../../components/ui/SettingsRow/SettingsRow.module.css';

export default function NotificationToggleRow({ enabled, value }) {
  const [dailyReminder, setDailyReminder] = useState(enabled);
  const [error, setError] = useState('');

  async function toggleReminder(nextValue) {
    setDailyReminder(nextValue);
    setError('');

    try {
      await updatePreference('dailyReminderEnabled', nextValue);
    } catch (err) {
      setDailyReminder(!nextValue);
      setError(err.message || 'Unable to update reminder.');
    }
  }

  return (
    <div className={`${styles.row} ${styles.rowToggle}`}>
      <span className="icon-circle w-8 h-8 lg:w-9 lg:h-9">
        <Icon name="bell" size={15} color="var(--gold)" />
      </span>

      <div className="flex-1">
        <div className={`serif ${styles.label}`}>Daily reading reminder</div>
        <div className={`muter ${styles.value}`}>{value}</div>
        {error && <div className={`muter ${styles.value}`}>{error}</div>}
      </div>

      <Toggle on={dailyReminder} onChange={toggleReminder} />
    </div>
  );
}
