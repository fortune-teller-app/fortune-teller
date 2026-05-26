'use client';

import { useRouter } from 'next/navigation';
import Icon from '../../decorations/Icon';

export default function BackButton({ className = 'icon-btn', size = 16, label = 'Back' }) {
  const router = useRouter();

  return (
    <button className={className} aria-label={label} onClick={() => router.back()}>
      <Icon name="back" size={size} />
    </button>
  );
}
