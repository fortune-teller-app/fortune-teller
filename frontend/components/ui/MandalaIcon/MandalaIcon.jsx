import { Mandala, Icon } from '../../decorations';
import styles from './MandalaIcon.module.css';

export default function MandalaIcon({
  icon,
  size,
  desktopSize,
  iconSize = 22,
  iconDesktopSize,
  animate = false,
  float = false,
  className = '',
}) {
  const mandalaSize = desktopSize ?? size;
  const iSize = iconDesktopSize ?? iconSize;
  const style = {
    '--mandala-size': `${size}px`,
    '--mandala-desktop-size': `${mandalaSize}px`,
    '--mandala-icon-size': `${iconSize}px`,
    '--mandala-icon-desktop-size': `${iSize}px`,
  };

  return (
    <div className={`relative flex justify-center ${styles.root} ${className}`} style={style}>
      <div className={float ? 'float' : undefined}>
        <Mandala size={mandalaSize} animate={animate} style={{ width: 'var(--mandala-render-size)', height: 'var(--mandala-render-size)' }} />
      </div>
      {icon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            name={icon}
            size={iSize}
            color="var(--gold)"
            style={{ width: 'var(--mandala-icon-render-size)', height: 'var(--mandala-icon-render-size)' }}
          />
        </div>
      )}
    </div>
  );
}
