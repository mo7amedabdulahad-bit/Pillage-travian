import type { PropsWithChildren } from 'react';
import { TbBugOff } from 'react-icons/tb';
import { Text } from 'app/components/text.tsx';
import styles from '../../page.module.css';

export const BugFixesBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className={styles.bugFixesBlock}>
      <div>
        <TbBugOff className="size-6 text-red-500" />
        <Text className="font-semibold">Bug fixes</Text>
      </div>
      <div className="ml-2">{children}</div>
    </div>
  );
};
