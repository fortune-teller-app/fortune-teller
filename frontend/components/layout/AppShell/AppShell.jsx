import { StarField, OrbitRings } from '../../decorations';
import BottomNav from '../BottomNav/BottomNav';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  return (
    <div className={`relative min-h-screen flex flex-col ${styles.shell}`}>
      <div className={styles.bg}>
        <StarField density="low" seed={3} />
        <OrbitRings density="low" />
      </div>

      <div className="relative z-[1] flex-1 flex flex-col">
        <main className={styles.main}>
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
