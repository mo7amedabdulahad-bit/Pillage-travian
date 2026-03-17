import type { PropsWithChildren } from 'react';
import { IoMdGitCompare } from 'react-icons/io';
import { Text } from 'app/components/text.tsx';
import styles from '../../page.module.css';

export const TechnicalImprovementBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className={styles.technicalImprovementBlock}>
      <div>
        <IoMdGitCompare className="size-6 text-purple-500" />
        <Text className="font-semibold">Technical improvements</Text>
      </div>
      <div className="ml-2">{children}</div>
    </div>
  );
};
