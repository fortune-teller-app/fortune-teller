import { notFound } from 'next/navigation';
import { BackButton } from '../../../../../components/ui';
import { getCurrentProfile } from '../../../../../lib/api/profile';
import EditFieldForm from './EditFieldForm';
import styles from '../../settings.module.css';

const FIELD_CONFIG = {
  name:          { title: 'Edit name',        label: 'Name',        type: 'text',  apiKey: 'name',       getValue: (p) => p.fullName },
  email:         { title: 'Edit email',       label: 'Email',       type: 'email', apiKey: 'email',      getValue: (p) => p.email },
  'birth-date':  { title: 'Edit birth date',  label: 'Birth date',  type: 'date',  apiKey: 'birthDate',  getValue: (p) => p.birthDate },
  'birth-place': { title: 'Edit birth place', label: 'Birth place', type: 'text',  apiKey: 'birthPlace', getValue: (p) => p.birthPlace },
};

export default async function EditSettingsField({ params }) {
  const { field } = await params;
  const config = FIELD_CONFIG[field];
  if (!config) notFound();

  const profile = await getCurrentProfile();

  return (
    <div className="screen-fade">
      <div className="content-wrap-narrow">

        <header className={`app-header ${styles.header}`}>
          <div className="left">
            <BackButton />
          </div>
          <h2>{config.title}</h2>
          <div className={styles.headerSpacer} />
        </header>

        <EditFieldForm
          apiKey={config.apiKey}
          label={config.label}
          type={config.type}
          initialValue={config.getValue(profile) ?? ''}
        />

      </div>
    </div>
  );
}
