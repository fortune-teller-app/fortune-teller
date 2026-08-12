import { redirect } from 'next/navigation';
import AppShell from '../../components/layout/AppShell/AppShell';
import { getAuthenticatedUser } from '../../lib/api/auth';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  return <AppShell>{children}</AppShell>;
}
