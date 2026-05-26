const r4 = (n) => Number(n.toFixed(4));

function pointsFor(n, radius) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `${(Math.cos(a) * radius).toFixed(2)},${(Math.sin(a) * radius).toFixed(2)}`;
  }).join(' ');
}

export default function Mandala({ size = 220, style, animate = true }) {
  const r = size / 2;
  const ticks = 60;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${r} -${r} ${size} ${size}`}
      style={style}
      aria-hidden="true"
    >
      <g fill="none" stroke="rgba(217,164,65,0.28)" strokeWidth="0.5">
        <circle r={Math.max(0, r - 4)} />
        <circle r={Math.max(0, r - 24)} />
        <circle r={Math.max(0, r - 56)} strokeDasharray="2 4" />
        <circle r={Math.max(0, r - 84)} />
      </g>
      <g
        className={animate ? 'orbit-anim slow' : ''}
        stroke="rgba(217,164,65,0.5)"
        strokeWidth="0.6"
      >
        {Array.from({ length: ticks }).map((_, i) => {
          const a = (i / ticks) * Math.PI * 2;
          const x1 = r4(Math.cos(a) * (r - 14));
          const y1 = r4(Math.sin(a) * (r - 14));
          const x2 = r4(Math.cos(a) * (r - 4));
          const y2 = r4(Math.sin(a) * (r - 4));
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              opacity={i % 5 === 0 ? 0.9 : 0.25}
            />
          );
        })}
      </g>
      <g className={animate ? 'orbit-anim' : ''}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const rr = Math.max(0, r - 70);
          const x = r4(Math.cos(a) * rr);
          const y = r4(Math.sin(a) * rr);
          return (
            <circle
              key={i}
              cx={x} cy={y}
              r={i % 3 === 0 ? 1.8 : 1}
              fill="#D9A441"
              opacity={i % 3 === 0 ? 1 : 0.5}
            />
          );
        })}
      </g>
      <g stroke="rgba(217,164,65,0.35)" strokeWidth="0.5" fill="none">
        <polygon points={pointsFor(6, r - 28)} />
        <polygon points={pointsFor(6, r - 28)} transform="rotate(30)" />
      </g>
      <circle r={3} fill="#D9A441" />
    </svg>
  );
}
