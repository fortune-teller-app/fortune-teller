const r4 = (n) => Number(n.toFixed(4));

export default function OrbitRings({ density = 'med' }) {
  if (density === 'none') return null;
  const rings = density === 'high' ? 5 : density === 'low' ? 2 : 3;

  return (
    <svg
      className="phone-bg-screen"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g transform="translate(195 420)" className="orbit-anim">
        {Array.from({ length: rings }).map((_, i) => {
          const rx = 180 + i * 70;
          return (
            <ellipse
              key={i}
              cx={0}
              cy={0}
              rx={rx}
              ry={r4(rx * 0.62)}
              fill="none"
              stroke="rgba(217,164,65,0.10)"
              strokeWidth="0.6"
              transform={`rotate(${i * 28})`}
            />
          );
        })}
      </g>
    </svg>
  );
}
