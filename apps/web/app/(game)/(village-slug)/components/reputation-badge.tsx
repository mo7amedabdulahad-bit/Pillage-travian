import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { ReputationLevel } from '@pillage-first/types/models/reputation';

type ReputationBadgeProps = {
  level: ReputationLevel;
  className?: string;
};

export const ReputationBadge = ({ level, className }: ReputationBadgeProps) => {
  const { t } = useTranslation();

  const getBadgeStyles = (level: ReputationLevel) => {
    switch (level) {
      case 'ecstatic':
      case 'honored':
      case 'respected':
      case 'friendly':
        return 'bg-green-600/20 text-green-600 border-green-600/30';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      case 'unfriendly':
      case 'hostile':
      case 'hated':
        return 'bg-red-600/20 text-red-600 border-red-600/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getBadgeLabel = (level: ReputationLevel) => {
    switch (level) {
      case 'ecstatic':
      case 'honored':
      case 'respected':
      case 'friendly':
        return t('Ally');
      case 'unfriendly':
      case 'hostile':
      case 'hated':
        return t('Enemy');
      default:
        return t('Neutral');
    }
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border tracking-wider',
        getBadgeStyles(level),
        className,
      )}
    >
      {getBadgeLabel(level)} - {t(`REPUTATIONS.${level.toUpperCase()}`)}
    </div>
  );
};
