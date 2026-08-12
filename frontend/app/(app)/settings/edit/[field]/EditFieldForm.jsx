'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../../../../../lib/api/profile';
import styles from './edit.module.css';

export default function EditFieldForm({ apiKey, label, type, initialValue }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await updateProfile({ [apiKey]: value });
      router.push('/settings');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Unable to save changes. Try again.');
      setLoading(false);
    }
  }

  function handleCancel() {
    router.push('/settings');
  }

  return (
    <div className="section">
      <div className="field">
        <span className="field-label">{label}</span>
        <input
          type={type}
          value={value ?? ''}
          onChange={e => setValue(e.target.value)}
        />
      </div>

      {error && <p className={`mute ${styles.errorText}`}>{error}</p>}

      <div className={styles.actions}>
        <button className="btn btn-gold btn-block" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={handleCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}
