import type { PropsWithChildren } from 'react';
import { BiWrench } from 'react-icons/bi';
import { Text } from 'app/components/text.tsx';
import styles from '../../page.module.css';

export const PerformanceBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className={styles.performanceBlock}>
      <div>
        <BiWrench className="size-6 text-amber-500" />
        <Text className="font-semibold">Performance</Text>
      </div>
      <div className="ml-2">{children}</div>
    </div>
  );
};
