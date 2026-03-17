import type { PropsWithChildren } from 'react';
import { MdOutlineNewReleases } from 'react-icons/md';
import { Text } from 'app/components/text.tsx';
import styles from '../../page.module.css';

export const FeaturesBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className={styles.featuresBlock}>
      <div>
        <MdOutlineNewReleases className="size-6 text-blue-500" />
        <Text className="font-semibold">New features</Text>
      </div>
      <div className="ml-2">{children}</div>
    </div>
  );
};
