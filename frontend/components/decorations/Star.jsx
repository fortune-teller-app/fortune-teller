export default function Star({ size = 14, style, filled = false }) {
  const pts = (() => {
    const n = 4;
    const out = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? 6 : 2;
      out.push(`${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`);
    }
    return out.join(' ');
  })();

  return (
    <svg width={size} height={size} viewBox="-7 -7 14 14" style={style} aria-hidden="true">
      <polygon
        points={pts}
        fill={filled ? '#D9A441' : 'none'}
        stroke="#D9A441"
        strokeWidth="0.6"
      />
    </svg>
  );
}
