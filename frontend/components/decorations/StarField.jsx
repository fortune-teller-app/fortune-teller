export default function StarField({ density = 'med', seed = 7 }) {
  const count = density === 'high' ? 70 : density === 'low' ? 20 : 42;

  const stars = (() => {
    // 32-bit LCG using only integer arithmetic — identical on V8, SpiderMonkey,
    // and JavaScriptCore. Math.sin with large args can differ across engines.
    let s = (seed * 9301 + 49297) | 0;
    const next = () => {
      s = (Math.imul(s, 1664525) + 1013904223) | 0;
      return (s >>> 0) / 0x100000000;
    };
    return Array.from({ length: count }, (_, i) => ({
      x: next() * 100,
      y: next() * 100,
      r: 0.5 + next() * 1.4,
      o: 0.2 + next() * 0.7,
      tw: i % 3,
    }));
  })();

  return (
    <svg
      className="phone-bg"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bg-glow-a" cx="80%" cy="0%" r="60%">
          <stop offset="0%" stopColor="rgba(217,164,65,0.18)" />
          <stop offset="100%" stopColor="rgba(217,164,65,0)" />
        </radialGradient>
        <radialGradient id="bg-glow-b" cx="10%" cy="80%" r="70%">
          <stop offset="0%" stopColor="rgba(91,71,180,0.25)" />
          <stop offset="100%" stopColor="rgba(91,71,180,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#060512" />
      <rect width="100%" height="100%" fill="url(#bg-glow-a)" />
      <rect width="100%" height="100%" fill="url(#bg-glow-b)" />
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="#F8F1E4"
          opacity={s.o}
          className={`twinkle${s.tw === 1 ? ' b' : s.tw === 2 ? ' c' : ''}`}
        />
      ))}
    </svg>
  );
}
