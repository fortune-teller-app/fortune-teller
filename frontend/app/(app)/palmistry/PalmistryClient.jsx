'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../../components/decorations';
import { MandalaIcon } from '../../../components/ui';
import { analyzePalm, PALM_HANDS, validatePalmImage } from '../../../lib/api/palm';
import PalmResult from './PalmResult';
import styles from './palmistry.module.css';

const STEP_TITLES = {
  intro: 'Palmistry',
  hand: 'Choose a hand',
  upload: 'Your palm',
  preview: 'Confirm',
  analyzing: 'Reading',
  error: 'Reading',
  result: 'Your reading',
};

// Steps that show the progress dots, in order.
const DOT_STEPS = ['hand', 'upload', 'preview'];

export default function PalmistryClient() {
  const router = useRouter();
  const [step, setStep] = useState('intro');
  const [hand, setHand] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [reading, setReading] = useState(null);
  const headingRef = useRef(null);

  // Object URL lifecycle: created per file, revoked when the file changes or the flow unmounts.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Move focus to the step heading so keyboard and screen-reader users land in the new content.
  useEffect(() => {
    if (step !== 'intro') headingRef.current?.focus();
  }, [step]);

  // Mock analysis. The cancel flag keeps a stale response from landing after the user leaves the step.
  useEffect(() => {
    if (step !== 'analyzing') return undefined;
    let cancelled = false;

    analyzePalm({ hand, image: file })
      .then(result => {
        if (cancelled) return;
        setReading(result);
        setStep('result');
      })
      .catch(err => {
        if (cancelled) return;
        setAnalysisError(err?.message || 'The reading could not be completed.');
        setStep('error');
      });

    return () => { cancelled = true; };
  }, [step, hand, file]);

  const handleFile = useCallback((nextFile) => {
    const message = validatePalmImage(nextFile);
    if (message) {
      setUploadError(message);
      return;
    }
    setUploadError('');
    setFile(nextFile);
    setStep('preview');
  }, []);

  const handleImageError = useCallback(() => {
    setFile(null);
    setUploadError('That image could not be opened. Try a different photo.');
    setStep('upload');
  }, []);

  const reset = useCallback(() => {
    setHand(null);
    setFile(null);
    setReading(null);
    setUploadError('');
    setAnalysisError('');
    setStep('intro');
  }, []);

  const goBack = useCallback(() => {
    setUploadError('');
    if (step === 'intro') router.back();
    else if (step === 'hand') setStep('intro');
    else if (step === 'upload') setStep('hand');
    else if (step === 'preview') { setFile(null); setStep('upload'); }
    else if (step === 'error') setStep('preview');
  }, [step, router]);

  const canGoBack = !['analyzing', 'result'].includes(step);
  const dotIndex = DOT_STEPS.indexOf(step);

  return (
    <div className="screen-fade">
      <div className="content-wrap-narrow">

        <header className={`app-header ${styles.header}`}>
          <div className="left">
            {canGoBack ? (
              <button type="button" className="icon-btn" aria-label="Back" onClick={goBack}>
                <Icon name="back" size={16} />
              </button>
            ) : (
              <span className={styles.headerSpacer} />
            )}
          </div>
          <h2>{STEP_TITLES[step]}</h2>
          <div className={styles.headerSpacer} />
        </header>

        {dotIndex >= 0 && (
          <div className={styles.progress} role="img" aria-label={`Step ${dotIndex + 1} of ${DOT_STEPS.length}`}>
            <div className="dots">
              {DOT_STEPS.map((id, i) => <span key={id} className={i <= dotIndex ? 'on' : ''} />)}
            </div>
          </div>
        )}

        {step === 'intro' && <IntroStep headingRef={headingRef} onBegin={() => setStep('hand')} />}

        {step === 'hand' && (
          <HandStep
            headingRef={headingRef}
            hand={hand}
            onSelect={setHand}
            onContinue={() => setStep('upload')}
          />
        )}

        {step === 'upload' && (
          <UploadStep headingRef={headingRef} hand={hand} error={uploadError} onFile={handleFile} />
        )}

        {step === 'preview' && (
          <PreviewStep
            headingRef={headingRef}
            hand={hand}
            previewUrl={previewUrl}
            onImageError={handleImageError}
            onChange={() => { setFile(null); setStep('upload'); }}
            onAnalyze={() => { setAnalysisError(''); setStep('analyzing'); }}
          />
        )}

        {step === 'analyzing' && <AnalyzingStep headingRef={headingRef} />}

        {step === 'error' && (
          <ErrorStep
            headingRef={headingRef}
            message={analysisError}
            onRetry={() => { setAnalysisError(''); setStep('analyzing'); }}
            onBack={goBack}
          />
        )}

        {step === 'result' && reading && (
          <PalmResult headingRef={headingRef} reading={reading} onReset={reset} />
        )}

      </div>
    </div>
  );
}

function IntroStep({ headingRef, onBegin }) {
  return (
    <div className={`section ${styles.centered}`}>
      <MandalaIcon icon="hand" size={200} desktopSize={240} iconSize={40} iconDesktopSize={48} animate float />

      <p className="eyebrow">The lines of the hand</p>
      <h1 ref={headingRef} tabIndex={-1} className={`serif ${styles.title}`}>
        Let your palm <span className="serif-i gold">speak</span>
      </h1>
      <p className={`mute ${styles.lede}`}>
        Share a photo of your palm and its lines, mounts, and shape will be interpreted into a reading just for you.
      </p>

      <div className={styles.actions}>
        <button type="button" className="btn btn-gold btn-block" onClick={onBegin}>
          Begin Reading
        </button>
      </div>
    </div>
  );
}

function HandStep({ headingRef, hand, onSelect, onContinue }) {
  return (
    <div className="section">
      <h1 ref={headingRef} tabIndex={-1} className={`serif ${styles.stepTitle}`}>Which hand shall we read?</h1>
      <p className={`mute ${styles.stepLede}`}>
        The left shows what you were born with, the right what you have made of it.
      </p>

      <fieldset className={styles.handGroup}>
        <legend className={styles.srOnly}>Hand to interpret</legend>
        {Object.entries(PALM_HANDS).map(([id, meta]) => (
          <label key={id} className={`card ${styles.handCard} ${hand === id ? styles.handCardActive : ''}`}>
            <input
              type="radio"
              name="hand"
              value={id}
              checked={hand === id}
              onChange={() => onSelect(id)}
              className={styles.srOnly}
            />
            <span className="icon-circle w-11 h-11">
              <Icon
                name="hand"
                size={20}
                color="var(--gold)"
                style={id === 'left' ? { transform: 'scaleX(-1)' } : undefined}
              />
            </span>
            <span className={styles.handText}>
              <span className={`serif ${styles.handName}`}>{meta.label}</span>
              <span className={`muter ${styles.handNote}`}>{meta.note}</span>
            </span>
            <span className={styles.handCheck} aria-hidden="true">
              {hand === id && <Icon name="check" size={14} color="var(--gold)" />}
            </span>
          </label>
        ))}
      </fieldset>

      <div className={styles.actions}>
        <button type="button" className="btn btn-gold btn-block" disabled={!hand} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

function UploadStep({ headingRef, hand, error, onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputId = 'palm-image-input';

  function handleChange(e) {
    const picked = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file after an error
    if (picked) onFile(picked);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  }

  return (
    <div className="section">
      <h1 ref={headingRef} tabIndex={-1} className={`serif ${styles.stepTitle}`}>
        Show us your {hand === 'left' ? 'left' : 'right'} palm
      </h1>

      <div
        className={`card ${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className={styles.guide} aria-hidden="true">
          <span className={`${styles.corner} ${styles.cornerTl}`} />
          <span className={`${styles.corner} ${styles.cornerTr}`} />
          <span className={`${styles.corner} ${styles.cornerBl}`} />
          <span className={`${styles.corner} ${styles.cornerBr}`} />
          <svg className={styles.guideRings} viewBox="-120 -120 240 240">
            <circle r="104" fill="none" stroke="var(--gold)" strokeWidth="0.4" />
            <circle r="72" fill="none" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="2 4" />
          </svg>
          <Icon
            name="hand"
            size={88}
            color="var(--gold)"
            strokeWidth={0.7}
            style={{ transform: hand === 'left' ? 'scaleX(-1)' : undefined }}
          />
        </div>

        <p className={`serif ${styles.dropTitle}`}>Place your palm within the frame</p>
        <p className={`muter ${styles.dropHint}`}>Drop an image here, or choose one below</p>

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.srOnly}
          onChange={handleChange}
          aria-describedby={error ? 'palm-upload-error' : 'palm-upload-tips'}
        />
        <label htmlFor={inputId} className={`btn btn-gold ${styles.pickBtn}`}>
          <Icon name="upload" size={16} color="currentColor" />
          Choose Image
        </label>
      </div>

      {error && (
        <p id="palm-upload-error" role="alert" className={styles.error}>{error}</p>
      )}

      <ul id="palm-upload-tips" className={styles.tips}>
        <li>Open your hand flat, fingers gently spread</li>
        <li>Use soft, even light, with no harsh shadows</li>
        <li>Fill the frame and keep the lines in focus</li>
      </ul>
      <p className={`muter ${styles.formats}`}>JPG, PNG or WebP · up to 10 MB</p>
    </div>
  );
}

function PreviewStep({ headingRef, hand, previewUrl, onImageError, onChange, onAnalyze }) {
  const handLabel = PALM_HANDS[hand]?.label ?? 'Hand';

  return (
    <div className="section">
      <h1 ref={headingRef} tabIndex={-1} className={`serif ${styles.stepTitle}`}>Is this the one?</h1>

      <div className={`card ${styles.previewCard}`}>
        <div className={styles.previewFrame}>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL, not optimizable by next/image
            <img
              src={previewUrl}
              alt={`Your selected ${handLabel.toLowerCase()} palm photo`}
              className={styles.previewImg}
              onError={onImageError}
            />
          )}
        </div>
        <div className={styles.previewMeta}>
          <span className="badge"><span className="dot-gold" />{handLabel}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className="btn btn-gold btn-block" onClick={onAnalyze}>
          Analyze Palm
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onChange}>
          Choose Another Image
        </button>
      </div>
    </div>
  );
}

function AnalyzingStep({ headingRef }) {
  return (
    <div className={`section ${styles.centered}`} role="status" aria-live="polite">
      <MandalaIcon icon="hand" size={220} desktopSize={260} iconSize={40} iconDesktopSize={48} animate />
      <h1 ref={headingRef} tabIndex={-1} className={`serif-i ${styles.title}`}>Reading the lines…</h1>
      <p className={`mute ${styles.lede}`}>Tracing life, heart, head, and fate. This takes a moment.</p>
      <div className={`${styles.loadingBar} shimmer`} aria-hidden="true" />
    </div>
  );
}

function ErrorStep({ headingRef, message, onRetry, onBack }) {
  return (
    <div className={`section ${styles.centered}`}>
      <span className="icon-circle w-14 h-14">
        <Icon name="x" size={22} color="var(--danger)" />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className={`serif ${styles.title}`}>The lines stayed hidden</h1>
      <p role="alert" className={`mute ${styles.lede}`}>
        {message || 'The reading could not be completed.'} Please try again.
      </p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-gold btn-block" onClick={onRetry}>Try Again</button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
