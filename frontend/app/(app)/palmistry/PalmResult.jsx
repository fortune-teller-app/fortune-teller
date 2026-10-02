'use client';

import { useState } from 'react';
import { Icon } from '../../../components/decorations';
import { PALM_HANDS, savePalmReading } from '../../../lib/api/palm';
import styles from './palmistry.module.css';

const LINE_ORDER = ['life', 'heart', 'head', 'fate'];

export default function PalmResult({ headingRef, reading, onReset }) {
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      await savePalmReading(reading);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <div className="section">
      <div className={styles.resultHead}>
        <span className="badge"><span className="dot-gold" />{PALM_HANDS[reading.hand]?.label}</span>
        <h1 ref={headingRef} tabIndex={-1} className={`serif ${styles.stepTitle}`}>
          Your palm, <span className="serif-i gold">read</span>
        </h1>
      </div>

      <article className={`card card-glass ${styles.mainReading}`}>
        <p className="eyebrow">Overall interpretation</p>
        <p className={`serif ${styles.interpretation}`}>{reading.interpretation}</p>
      </article>

      <div className={styles.detailGrid}>
        <section className={`card ${styles.detailCard}`}>
          <p className="eyebrow">Hand shape</p>
          <h3 className={`serif ${styles.detailTitle}`}>{reading.handShape.name}</h3>
          <p className={`mute ${styles.detailText}`}>{reading.handShape.description}</p>
        </section>

        {LINE_ORDER.map(key => (
          <section key={key} className={`card ${styles.detailCard}`}>
            <p className="eyebrow">{reading.lines[key].title}</p>
            <p className={`mute ${styles.detailText}`}>{reading.lines[key].summary}</p>
          </section>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-gold btn-block"
          onClick={handleSave}
          disabled={saveState === 'saving' || saveState === 'saved'}
        >
          {saveState === 'saved' && <Icon name="check" size={16} color="currentColor" />}
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Reading Saved' : 'Save Reading'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onReset}>
          Read Another
        </button>
        {saveState === 'error' && (
          <p role="alert" className={styles.error}>Your reading could not be saved. Try again.</p>
        )}
      </div>
    </div>
  );
}
