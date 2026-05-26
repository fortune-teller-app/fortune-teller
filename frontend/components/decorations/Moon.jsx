export default function Moon({ size = 32, style }) {
  const id = `moon-m-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} aria-hidden="true">
      <defs>
        <mask id={id}>
          <rect width="32" height="32" fill="black" />
          <circle cx="16" cy="16" r="13" fill="white" />
          <circle cx="22" cy="13" r="11" fill="black" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="13" fill="#D9A441" mask={`url(#${id})`} />
    </svg>
  );
}
