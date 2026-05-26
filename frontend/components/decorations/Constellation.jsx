export default function Constellation({ size = 200, style }) {
  const stars = [
    { x: 30, y: 40 }, { x: 80, y: 20 }, { x: 140, y: 60 },
    { x: 110, y: 120 }, { x: 50, y: 140 }, { x: 170, y: 150 },
  ];
  const lines = [
    [0, 1], [1, 2], [2, 3], [3, 4], [2, 5],
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={style} aria-hidden="true">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={stars[a].x} y1={stars[a].y}
          x2={stars[b].x} y2={stars[b].y}
          stroke="rgba(217,164,65,0.3)" strokeWidth="0.6"
        />
      ))}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={i === 0 ? 2 : 1.2}
          fill="#D9A441" opacity={i === 0 ? 1 : 0.7} />
      ))}
    </svg>
  );
}
