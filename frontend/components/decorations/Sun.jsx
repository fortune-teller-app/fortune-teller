export default function Sun({ size = 32, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} aria-hidden="true">
      <circle cx="16" cy="16" r="7" fill="#D9A441" opacity="0.9" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#D9A441" strokeWidth="0.5" opacity="0.4" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={16 + Math.cos(a) * 12} y1={16 + Math.sin(a) * 12}
            x2={16 + Math.cos(a) * 14} y2={16 + Math.sin(a) * 14}
            stroke="#D9A441" strokeWidth="1" opacity="0.6"
          />
        );
      })}
    </svg>
  );
}
