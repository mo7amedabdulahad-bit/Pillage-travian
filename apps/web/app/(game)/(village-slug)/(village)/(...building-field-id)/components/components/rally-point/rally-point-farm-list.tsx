import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useRallyPoint } from 'app/(game)/(village-slug)/hooks/use-rally-point';
import { HeroIcon } from 'app/components/hero-icon';
import { Text } from 'app/components/text';
import { TribeTroopIcon } from 'app/components/tribe-troop-icon';
import { Button } from 'app/components/ui/button';

interface FarmListDetails {
  id: number;
  name: string;
  tiles: {
    tileId: number;
    troops?: { unitId: string; amount: number }[];
  }[];
}

const FarmListModule = ({
  farmList,
}: {
  farmList: { id: number; name: string };
}) => {
  const { t } = useTranslation();
  const { getFarmList, raidFarmList, isRaiding, raidFarmTile, isRaidingTile } =
    useRallyPoint();
  const [details, setDetails] = useState<FarmListDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Keep track of which tile is being raided individually
  const [raidingTileId, setRaidingTileId] = useState<number | null>(null);

  const handleToggle = async () => {
    if (!isOpen && !details) {
      setLoading(true);
      const data = (await getFarmList(
        farmList.id,
      )) as unknown as FarmListDetails;
      setDetails(data);
      setLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const handleRaidTile = async (tileId: number) => {
    setRaidingTileId(tileId);
    try {
      await raidFarmTile({ farmListId: farmList.id, tileId });
    } finally {
      setRaidingTileId(null);
    }
  };

  return (
    <div className="border rounded-xs bg-muted/10 mb-2 overflow-hidden">
      <button
        type="button"
        className="w-full px-4 py-3 cursor-pointer hover:bg-muted/20 flex items-center justify-between text-left"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle();
          }
        }}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <HiChevronUp size={16} /> : <HiChevronDown size={16} />}
          <Text className="font-bold">{farmList.name}</Text>
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            raidFarmList(farmList.id);
          }}
          disabled={isRaiding}
        >
          {t('Raid All')}
        </Button>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t bg-background/50">
          {loading ? (
            <div className="mt-4 flex justify-center">
              <Text className="italic">{t('Loading farms...')}</Text>
            </div>
          ) : details?.tiles?.length === 0 ? (
            <div className="mt-4 flex justify-center">
              <Text className="italic">{t('No farms in this list')}</Text>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {details?.tiles?.map((tile) => (
                <div
                  key={tile.tileId}
                  className="flex items-center justify-between p-2 border rounded-xs bg-background"
                >
                  <div className="flex flex-col">
                    <Text className="font-medium">
                      {t('Farm')} #{tile.tileId}
                    </Text>
                    <div className="flex gap-2">
                      {tile.troops?.map((troop) => (
                        <div
                          key={troop.unitId}
                          className="flex items-center gap-0.5 opacity-70"
                        >
                          {troop.unitId === 'HERO' ? (
                            <HeroIcon
                              size="small"
                              className="size-3"
                            />
                          ) : (
                            <TribeTroopIcon
                              unitId={troop.unitId}
                              size="small"
                              className="size-3"
                            />
                          )}
                          <Text>{troop.amount}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRaidTile(tile.tileId)}
                    disabled={isRaidingTile && raidingTileId === tile.tileId}
                  >
                    {t('Raid')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RallyPointFarmList = () => {
  const { t } = useTranslation();
  const { farmLists } = useRallyPoint();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="farm-list" />
        <div className="flex justify-between items-center mb-4">
          <Text as="h2">{t('Farm lists')}</Text>
          <Button
            size="sm"
            variant="outline"
          >
            {t('Create new list')}
          </Button>
        </div>

        {farmLists.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-xs">
            <Text className="text-muted-foreground">
              {t('You have no farm lists yet')}
            </Text>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {farmLists.map((list) => (
              <FarmListModule
                key={list.id}
                farmList={list}
              />
            ))}
          </div>
        )}
      </SectionContent>
    </Section>
  );
};
