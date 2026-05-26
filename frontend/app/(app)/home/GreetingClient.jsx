'use client';

import { useEffect, useState } from 'react';
import styles from './home.module.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function GreetingClient({ firstName }) {
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    }));
    setGreeting(getGreeting());
  }, []);

  return (
    <div className={`section ${styles.greetingSection}`}>
      <span className="eyebrow">{dateStr && dateStr.toUpperCase()}</span>
      <h1 className={`serif ${styles.headline}`}>
        {greeting ? `${greeting},` : null}<br />
        <em className="serif-i gold">{firstName}.</em>
      </h1>
      <p className={`mute ${styles.subtext}`}>
        Choose a practice and let the oracle begin.
      </p>
    </div>
  );
}
