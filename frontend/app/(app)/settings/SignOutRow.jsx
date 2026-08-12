'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsRow } from '../../../components/ui';
import { logoutUser } from '../../../lib/api/auth';

export default function SignOutRow() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);

    try {
      await logoutUser();
    } finally {
      router.replace('/login');
    }
  }

  return (
    <SettingsRow
      icon="logout"
      label={loading ? 'Signing out…' : 'Sign out'}
      onClick={handleSignOut}
      disabled={loading}
    />
  );
}
