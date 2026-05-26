import { BackButton, SettingsRow, SettingsGroup } from '../../../components/ui';
import { getCurrentProfile } from '../../../lib/api/profile';
import { getCurrentPreferences } from '../../../lib/api/preferences';
import NotificationToggleRow from './NotificationToggleRow';
import styles from './settings.module.css';

function formatBirthDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

function formatReminder(preferences) {
  return `${preferences.dailyReminderTime}, ${preferences.dailyReminderDays[0]}-${preferences.dailyReminderDays.at(-1)}`;
}

export default async function Settings() {
  const [profile, preferences] = await Promise.all([
    getCurrentProfile(),
    getCurrentPreferences(),
  ]);

  return (
    <div className="screen-fade">
      <div className="content-wrap-narrow">

        <header className={`app-header ${styles.header}`}>
          <div className="left">
            <BackButton />
          </div>
          <h2>Settings</h2>
          <div className={styles.headerSpacer} />
        </header>

        <SettingsGroup title="Account">
          <SettingsRow icon="user"     label="Name"       value={profile.fullName} />
          <SettingsRow icon="mail"     label="Email"      value={profile.email} />
          <SettingsRow icon="calendar" label="Birth date" value={formatBirthDate(profile.birthDate)} />
          <SettingsRow icon="globe"    label="Birth place" value={profile.birthPlace} />
        </SettingsGroup>

        <SettingsGroup title="Notifications">
          <NotificationToggleRow
            enabled={preferences.dailyReminderEnabled}
            value={formatReminder(preferences)}
          />
        </SettingsGroup>

        <SettingsGroup title="Contact">
          <SettingsRow icon="book"    label="Help center"      value="Guides and common questions" />
          <SettingsRow icon="mail"    label="Send feedback"    value="Share ideas or suggestions" />
          <SettingsRow icon="sparkle" label="Report a problem" value="Tell us what went wrong" />
        </SettingsGroup>

        <SettingsGroup title="Policies">
          <SettingsRow icon="book" label="Terms of Service" />
          <SettingsRow icon="lock" label="Privacy Policy" />
          <SettingsRow icon="eye"  label="Disclaimer" value="For entertainment purposes" />
        </SettingsGroup>

        <SettingsGroup title="Account actions">
          <SettingsRow icon="diamond" label="Manage plan" value={`${profile.subscription.planName} · ${profile.subscription.statusLabel}`} />
          <SettingsRow icon="logout"  label="Sign out" />
          <SettingsRow icon="x"       label="Delete account" danger />
        </SettingsGroup>

        <div className={`section ${styles.versionSection}`}>
          <div className={`serif-i ${styles.version}`}>FT · v 1.4.0</div>
        </div>

      </div>
    </div>
  );
}
