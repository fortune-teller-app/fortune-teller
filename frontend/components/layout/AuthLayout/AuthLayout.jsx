import { StarField, OrbitRings } from '../../decorations';
import styles from './AuthLayout.module.css';

export default function AuthLayout({ children, seed = 7, orbits = 'med' }) {
  return (
    <div className={`relative min-h-screen flex flex-col ${styles.screen}`}>
      <div className={styles.bg}>
        <StarField density="med" seed={seed} />
        <OrbitRings density={orbits} />
      </div>
      <div className="screen-fade relative z-[1] flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
