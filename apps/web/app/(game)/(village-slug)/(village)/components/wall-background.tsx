import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
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
  const navigate = useNavigate();
  const { currentVillage } = useCurrentVillage();

  const wallBuildingField = currentVillage.buildingFields.find(
    (bf) => bf.id === 40,
  );
  const wallBuildingId = wallBuildingField?.buildingId ?? 'CITY_WALL';

  const wallTopPath = getWallTopPath(tribe, 'default', 'day');
  const wallBottomPath = getWallBottomPath(tribe, 'default', 'day');

  const handleWallClick = () => {
    navigate('../40');
  };

  return (
    <>
      {/* Wall Top */}
      <button
        type="button"
        onClick={handleWallClick}
        className={clsx(
          styles['wall-top'],
          'absolute top-0 left-0 w-full z-10 cursor-pointer',
        )}
        aria-label={t(`BUILDINGS.${wallBuildingId}.NAME`)}
        data-testid="wall-top"
      >
        <img
          src={wallTopPath}
          alt={t(`BUILDINGS.${wallBuildingId}.NAME`)}
          className="w-full h-auto"
        />
      </button>

      {/* Wall Bottom */}
      <button
        type="button"
        onClick={handleWallClick}
        className={clsx(
          styles['wall-bottom'],
          'absolute bottom-0 left-0 w-full z-10 cursor-pointer',
        )}
        aria-label={t(`BUILDINGS.${wallBuildingId}.NAME`)}
        data-testid="wall-bottom"
      >
        <img
          src={wallBottomPath}
          alt={t(`BUILDINGS.${wallBuildingId}.NAME`)}
          className="w-full h-auto"
        />
      </button>
    </>
  );
}
