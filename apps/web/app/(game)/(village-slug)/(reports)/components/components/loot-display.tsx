import { useTranslation } from 'react-i18next';
import { icons } from 'app/components/icons/icons';
import { Text } from 'app/components/text';

type LootDisplayProps = {
  loot: [number, number, number, number];
  capacity: number;
};

export const LootDisplay = ({ loot, capacity }: LootDisplayProps) => {
  const { t } = useTranslation();
  const totalLoot = loot.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-2 p-3 border border-border rounded-md bg-muted/5">
      <div className="flex items-center justify-between font-semibold border-b border-border pb-1">
        <span>{t('Loot')}</span>
        <span className="text-sm">
          {totalLoot} / {capacity}
        </span>
      </div>
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-1">
          {icons.wood({ className: 'size-4' })}
          <Text>{loot[0]}</Text>
        </div>
        <div className="flex items-center gap-1">
          {icons.clay({ className: 'size-4' })}
          <Text>{loot[1]}</Text>
        </div>
        <div className="flex items-center gap-1">
          {icons.iron({ className: 'size-4' })}
          <Text>{loot[2]}</Text>
        </div>
        <div className="flex items-center gap-1">
          {icons.wheat({ className: 'size-4' })}
          <Text>{loot[3]}</Text>
        </div>
      </div>
    </div>
  );
};
