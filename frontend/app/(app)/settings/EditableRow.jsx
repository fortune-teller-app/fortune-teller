'use client';

import { useRouter } from 'next/navigation';
import { SettingsRow } from '../../../components/ui';

export default function EditableRow({ href, icon, label, value }) {
  const router = useRouter();

  return (
    <SettingsRow
      icon={icon}
      label={label}
      value={value}
      onClick={() => router.push(href)}
    />
  );
}
