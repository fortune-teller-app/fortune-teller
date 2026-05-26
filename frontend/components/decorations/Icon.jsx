export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.4, style }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style,
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':     return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>;
    case 'history':  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'user':     return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>;
    case 'diamond':  return <svg {...common}><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'chevron':  return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'back':     return <svg {...common}><path d="M15 18l-6-6 6-6"/></svg>;
    case 'menu':     return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'bell':     return <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>;
    case 'search':   return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'moon':     return <svg {...common}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>;
    case 'sun':      return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case 'sparkle':  return <svg {...common}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/></svg>;
    case 'hand':     return <svg {...common}><path d="M7 11V6a1.5 1.5 0 0 1 3 0v5"/><path d="M10 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M13 11V5a1.5 1.5 0 0 1 3 0v9"/><path d="M16 9a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1.4a4 4 0 0 1-3.4-2L4 13"/></svg>;
    case 'book':     return <svg {...common}><path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2V5z"/><path d="M4 20a2 2 0 0 1 2-2h13"/></svg>;
    case 'spark':    return <svg {...common}><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10z"/></svg>;
    case 'globe':    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'lock':     return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'mail':     return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg>;
    case 'eye':      return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'heart':    return <svg {...common}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>;
    case 'share':    return <svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5"/></svg>;
    case 'plus':     return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x':        return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'check':    return <svg {...common}><path d="M5 12l5 5L20 7"/></svg>;
    case 'logout':   return <svg {...common}><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>;
    case 'edit':     return <svg {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'wand':     return <svg {...common}><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4"/><path d="M9 22 22 9l-3-3L6 19z"/></svg>;
    case 'logo':
      return (
        <svg width={size} height={size} viewBox="-12 -12 24 24" fill="none" aria-hidden="true" style={style}>
          <circle r="10" stroke={color} strokeWidth="0.6" fill="none" />
          <circle r="6"  stroke={color} strokeWidth="0.6" fill="none" />
          <circle r="2"  fill={color} />
          <line x1="-10" y1="0" x2="10" y2="0" stroke={color} strokeWidth="0.4" opacity="0.4" />
          <line x1="0" y1="-10" x2="0" y2="10" stroke={color} strokeWidth="0.4" opacity="0.4" />
        </svg>
      );
    default: return null;
  }
}
