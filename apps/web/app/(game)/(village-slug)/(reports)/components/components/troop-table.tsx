import { useTranslation } from 'react-i18next';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { HeroIcon } from 'app/components/hero-icon';
import { TroopIcon } from 'app/components/troop-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

type TroopTableProps = {
  tribe: Tribe;
  unitIds: string[];
  units: number[];
  losses: number[];
  title: string;
  villageName: string;
};

const TroopOrHeroIcon = ({
  tribe,
  unitId,
  size = 'small',
}: {
  tribe: Tribe;
  unitId: string;
  size?: 'small' | 'medium';
}) => {
  if (unitId === 'HERO') {
    return <HeroIcon size={size} />;
  }
  return (
    <TroopIcon
      tribe={tribe}
      unitId={unitId}
      size={size}
    />
  );
};

export const TroopTable = ({
  tribe,
  unitIds,
  units,
  losses,
  title,
  villageName,
}: TroopTableProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 border border-border rounded-md overflow-hidden">
      <div className="bg-muted/50 p-2 flex justify-between items-center border-b border-border font-semibold">
        <span>{title}</span>
        <span>{villageName}</span>
      </div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHeaderCell className="w-20 bg-muted/30">
              {t('Troops')}
            </TableHeaderCell>
            {unitIds.map((id) => (
              <TableHeaderCell
                key={id}
                className="p-1"
              >
                <div className="flex justify-center">
                  <TroopOrHeroIcon
                    tribe={tribe}
                    unitId={id}
                    size="small"
                  />
                </div>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="bg-muted/10 font-medium">
              {t('Amount')}
            </TableCell>
            {units.map((count, i) => (
              <TableCell
                key={unitIds[i]}
                className={count === 0 ? 'text-muted-foreground/30' : ''}
              >
                {count > 0 ? count : 0}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="bg-muted/10 font-medium">
              {t('Losses')}
            </TableCell>
            {losses.map((count, i) => (
              <TableCell
                key={unitIds[i]}
                className={
                  count === 0
                    ? 'text-muted-foreground/30'
                    : 'text-red-500 font-medium'
                }
              >
                {count > 0 ? count : 0}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
