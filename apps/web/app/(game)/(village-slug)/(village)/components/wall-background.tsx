import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  getWallBottomPath,
  getWallTopPath,
} from '@pillage-first/game-assets/village-page-assets';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import styles from './wall-background.module.scss';

export function WallBackground() {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();

  const wallBuildingField = currentVillage.buildingFields.find(
    (bf) => bf.id === 40,
  );
  const wallBuildingId = wallBuildingField?.buildingId ?? 'CITY_WALL';

  const wallTopPath = getWallTopPath(tribe, 'default', 'day');
  const wallBottomPath = getWallBottomPath(tribe, 'default', 'day');

  return (
    <>
      {/* Wall Top - decorative only, clickable via building slot field 40 */}
      <div className={clsx(styles['wall-top'])}>
        <img
          src={wallTopPath}
          alt={t(`BUILDINGS.${wallBuildingId}.NAME`)}
          className="w-full h-auto"
        />
      </div>

      {/* Wall Bottom - decorative only, clickable via building slot field 40 */}
      <div className={clsx(styles['wall-bottom'])}>
        <img
          src={wallBottomPath}
          alt={t(`BUILDINGS.${wallBuildingId}.NAME`)}
          className="w-full h-auto"
        />
      </div>
    </>
  );
}
