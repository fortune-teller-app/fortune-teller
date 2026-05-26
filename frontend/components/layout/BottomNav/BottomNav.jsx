'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '../../decorations';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { id: 'home',    to: '/home',    icon: 'home',    label: 'Home'   },
  { id: 'history', to: '/history', icon: 'history', label: 'Ledger' },
  { id: 'plans',   to: '/plans',   icon: 'diamond', label: 'Plans'  },
  { id: 'profile', to: '/profile', icon: 'user',    label: 'Self'   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={`bottom-nav ${styles.nav}`}>
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.id}
            href={item.to}
            className={active ? 'active' : ''}
          >
            <Icon name={item.icon} size={16} color={active ? 'var(--gold)' : 'var(--ink-3)'} />
            <span>{item.label}</span>
            <span className="ic-dot" />
          </Link>
        );
      })}
    </nav>
  );
}
