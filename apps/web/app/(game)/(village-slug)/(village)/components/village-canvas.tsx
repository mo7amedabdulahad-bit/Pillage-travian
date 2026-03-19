import type { ReactElement } from 'react';
import styles from './village-canvas.module.scss';

type VillageCanvasProps = {
  children: ReactElement;
};

export function VillageCanvas({ children }: VillageCanvasProps) {
  return (
    <div className={styles.container}>
      {/* Wall background layers */}
      {/* Building slots container */}
      <div className={styles['slots-container']}>{children}</div>
    </div>
  );
}
