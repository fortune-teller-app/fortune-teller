'use client';

import { useState } from 'react';
import styles from './PasswordField.module.css';

export default function PasswordField({ label = 'Passphrase', value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className={styles.wrap}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className={styles.toggle}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
