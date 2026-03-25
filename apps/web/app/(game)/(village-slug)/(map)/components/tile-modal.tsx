import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type {
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile,
  Tile,
} from '@pillage-first/types/models/tile';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from '@pillage-first/utils/guards/map';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from '@pillage-first/utils/math';
import { useOasisBonuses } from 'app/(game)/(village-slug)/(map)/hooks/use-oasis-bonuses';
import { ReputationBadge } from 'app/(game)/(village-slug)/components/reputation-badge';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { useRallyPoint } from 'app/(game)/(village-slug)/hooks/use-rally-point';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';

type TileModalResourcesProps = {
  tile: OccupiableTile;
};

const TileModalResources = ({ tile }: TileModalResourcesProps) => {
  const resources = parseResourcesFromRFC(
    tile.attributes.resourceFieldComposition,
  );

  return (
    <div className="flex justify-start text-sm">
      <Resources
        iconClassName="size-4"
        resources={resources}
      />
    </div>
  );
};

type TileModalProps = {
  tile: Tile;
};

const TileModalLocation = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  const distance = roundToNDecimalPoints(
    calculateDistanceBetweenPoints(
      currentVillage.coordinates,
      tile.coordinates,
    ),
  );
  const { x, y } = tile.coordinates;

  return (
    <span className="text-xs text-gray-500">
      ({x}|{y}) - {t('{{count}} fields', { count: distance })}
    </span>
  );
};

const TileModalPlayerInfo = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const { getReputation } = useReputations();

  const { tribe, name, faction } = tile.owner!;
  const { population, loyalty } = tile.ownerVillage!;

  return (
    <div className="flex flex-col gap-2">
      <span>
        {t('Player')} - {name}
      </span>
      {faction !== 'player' && (
        <>
          <span>
            {t('Faction')} - {t(`FACTIONS.${faction.toUpperCase()}`)}
          </span>
          <div className="flex items-center gap-2">
            <span>{t('Reputation')} -</span>
            <ReputationBadge level={getReputation(faction).reputationLevel} />
          </div>
        </>
      )}
      <span>
        {t('Tribe')} - {t(`TRIBES.${tribe.toUpperCase()}`)}
      </span>
      <span>
        {t('Population')} - {population}
      </span>
      {faction !== 'player' && loyalty !== undefined && (
        <span>
          {t('Loyalty')} - {loyalty}%
        </span>
      )}
    </div>
  );
};

type OasisTileModalProps = {
  tile: OasisTile;
};

const OasisTileModal = ({ tile }: OasisTileModalProps) => {
  const { t } = useTranslation();
  const { oasisBonuses } = useOasisBonuses(tile.id);

  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);

  const title = (() => {
    if (!isOccupiable) {
      return t('Wilderness');
    }
    return isOccupied ? t('Occupied oasis') : t('Unoccupied oasis');
  })();

  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <TileModalLocation tile={tile} />
      {isOccupiable && (
        <div className="flex justify-start gap-2 items-center">
          {oasisBonuses.map(({ resource, bonus }) => (
            <span
              key={resource}
              className="flex items-center gap-1"
            >
              <Icon
                className="size-4"
                type={resource}
              />
              <span>{bonus}</span>
            </span>
          ))}
        </div>
      )}
      <DialogDescription>
        {!isOccupiable && t('This is an un-occupiable oasis.')}
        {isOccupiable && (
          <>
            {isOccupied && (
              <>
                {tile.owner.id === PLAYER_ID &&
                  t(
                    'This oasis is occupied by you and is producing resources for village {{villageName}}.',
                    {
                      villageName: tile.ownerVillage.name,
                    },
                  )}
                {tile.owner.id !== PLAYER_ID &&
                  t(
                    'This oasis is occupied by another player. You can raid it, but doing so may trigger retaliations.',
                  )}
              </>
            )}
            {!isOccupied &&
              t(
                'This is an occupiable oasis. You can occupy this oasis by upgrading {{herosMansion}} to levels 10, 15 or 20.',
                {
                  herosMansion: t('BUILDINGS.HEROS_MANSION.NAME'),
                },
              )}
          </>
        )}
      </DialogDescription>
      {isOccupiable && <TileModalActions tile={tile} />}
    </DialogHeader>
  );
};

type OccupiableTileModalProps = {
  tile: OccupiableTile;
};

const OccupiableTileModal = ({ tile }: OccupiableTileModalProps) => {
  const { t } = useTranslation();
  const { events } = useEvents();
  const { villageTroops } = useVillageTroops();
  const { currentVillage } = useCurrentVillage();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOngoingSettleEventOnThisTile = events.some(
    (event) =>
      event.type === 'troopMovementSettle' &&
      'targetTileId' in event &&
      event.targetTileId === tile.id,
  );

  // Check if player has at least 3 settlers available in current village
  const availableSettlers = villageTroops
    .filter(
      (t) =>
        t.unitId.endsWith('_SETTLER') &&
        t.tileId === currentVillage.tileId &&
        t.source === currentVillage.tileId,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const hasEnoughSettlers = availableSettlers >= 3;

  // Check resources (750 each)
  const hasEnoughResources =
    currentVillage.resources.wood >= 750 &&
    currentVillage.resources.clay >= 750 &&
    currentVillage.resources.iron >= 750 &&
    currentVillage.resources.wheat >= 750;

  // Calculate travel time using settler speed
  const distance = calculateDistanceBetweenPoints(
    currentVillage.coordinates,
    tile.coordinates,
  );
  const settlerSpeed = 5; // settler unit speed
  const travelTimeHours = distance / settlerSpeed;
  const travelTimeMinutes = Math.ceil(travelTimeHours * 60);

  const { createEvent: createSettleEvent } = useCreateEvent(
    'troopMovementSettle',
  );

  const handleConfirm = () => {
    const settlerTroop = villageTroops.find(
      (t) =>
        t.unitId.endsWith('_SETTLER') &&
        t.tileId === currentVillage.tileId &&
        t.source === currentVillage.tileId,
    );

    if (!settlerTroop) {
      setError(t('You need 3 settlers trained in a Residence or Palace.'));
      return;
    }

    setIsSettling(true);
    setError(null);

    try {
      createSettleEvent({
        targetTileId: tile.id,
        troops: [
          {
            unitId: settlerTroop.unitId,
            amount: 3,
            tileId: currentVillage.tileId,
            source: currentVillage.tileId,
          },
        ],
        cachesToClearImmediately: [playerTroopsCacheKey],
      });

      const { x, y } = tile.coordinates;
      toast.success(t('Settlers dispatched to ({{x}}|{{y}})', { x, y }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('Failed to dispatch settlers'),
      );
    } finally {
      setIsSettling(false);
    }
  };

  if (hasOngoingSettleEventOnThisTile) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('Abandoned valley')}</DialogTitle>
          <TileModalLocation tile={tile} />
          <TileModalResources tile={tile} />
        </DialogHeader>
        <Text className="text-gray-500">
          {t('Settlers are already on route to this location')}
        </Text>
      </>
    );
  }

  if (showConfirm) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('Settle New Village')}</DialogTitle>
          <TileModalLocation tile={tile} />
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="rounded-md border bg-muted/30 p-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Destination')}</span>
              <span>
                ({tile.coordinates.x}|{tile.coordinates.y})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Travel time')}</span>
              <span>~{travelTimeMinutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('Settlers required')}
              </span>
              <span>3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Cost')}</span>
              <span>750 / 750 / 750 / 750</span>
            </div>
          </div>

          {!hasEnoughSettlers && (
            <Text className="text-sm text-destructive">
              {t('You need 3 settlers trained in a Residence or Palace.')}
            </Text>
          )}
          {hasEnoughSettlers && !hasEnoughResources && (
            <Text className="text-sm text-destructive">
              {t('Not enough resources. Founding costs 750 of each resource.')}
            </Text>
          )}
          {error && <Text className="text-sm text-destructive">{error}</Text>}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              {t('Back')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!hasEnoughSettlers || !hasEnoughResources || isSettling}
            >
              {isSettling ? t('Dispatching...') : t('Confirm')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Abandoned valley')}</DialogTitle>
        <TileModalLocation tile={tile} />
        <TileModalResources tile={tile} />
        <DialogDescription>
          {t(
            'You can establish a new village on this tile. To settle it, make sure you have 3 settlers and an unused expansion slot from one of your villages.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Text as="h3">{t('Actions')}</Text>
        <Button
          size="sm"
          variant="default"
          disabled={!hasEnoughSettlers || !hasEnoughResources}
          onClick={() => setShowConfirm(true)}
        >
          {t('Settle New Village')}
        </Button>
        {!hasEnoughSettlers && (
          <Text className="text-sm text-muted-foreground">
            {t('You need at least 3 settlers to found a new village.')}
          </Text>
        )}
        {hasEnoughSettlers && !hasEnoughResources && (
          <Text className="text-sm text-muted-foreground">
            {t('Not enough resources. Founding costs 750 of each resource.')}
          </Text>
        )}
      </div>
    </>
  );
};

type OccupiedOccupiableTileModalProps = {
  tile: OccupiedOccupiableTile;
};

const OccupiedOccupiableTileModal = ({
  tile,
}: OccupiedOccupiableTileModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentVillage } = useCurrentVillage();
  const { getNewVillageUrl } = useGameNavigation();
  const { villageTroops, sendTroops } = useVillageTroops();

  const currentVillageMovableTroops = villageTroops.filter(
    ({ tileId, source }) =>
      tileId === currentVillage.id && source === currentVillage.id,
  );

  const isHeroInCurrentVillage = currentVillageMovableTroops.some(
    ({ unitId }) => unitId === 'HERO',
  );

  const { owner, ownerVillage } = tile;
  const { id: playerId } = owner;
  const { name: villageName, slug: villageSlug } = ownerVillage;

  const isOwnedByPlayer = playerId === PLAYER_ID;

  const onSendHero = () => {
    sendTroops({
      targetId: tile.id,
      type: 'troopMovementRelocation',
      troops: [
        {
          unitId: 'HERO',
          amount: 1,
          tileId: currentVillage.id,
          source: currentVillage.id,
        },
      ],
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{villageName}</DialogTitle>
        <TileModalLocation tile={tile} />
        <TileModalResources tile={tile} />
        <DialogDescription>
          {isOwnedByPlayer
            ? t('This is your village.')
            : t(
                'This village belongs to another player. You may trade with it or attack it. Beware though, attacking may provoke retaliation!',
              )}
        </DialogDescription>
      </DialogHeader>
      <TileModalPlayerInfo tile={tile} />
      <div className="flex flex-col gap-2">
        <Text as="h3">{t('Actions')}</Text>
        {!isOwnedByPlayer && <TileModalActions tile={tile} />}
        {isOwnedByPlayer && tile.id !== currentVillage.id && (
          <>
            <Button
              size="fit"
              variant="link"
              onClick={() => navigate(getNewVillageUrl(villageSlug!))}
            >
              Enter village
            </Button>
            {isHeroInCurrentVillage && (
              <Button
                size="fit"
                variant="link"
                onClick={onSendHero}
              >
                Send hero
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
};

const TileModalActions = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentVillage } = useCurrentVillage();
  const { getRallyPointUrl, getMarketplaceUrl } = useGameNavigation();
  const { farmLists, addTileToFarmList, isAddingToFarmList, searchVillage } =
    useRallyPoint();
  const [isResolvingRallyPointTarget, setIsResolvingRallyPointTarget] =
    useState(false);

  const rallyPoint = currentVillage.buildingFields.find(
    (f) => f.buildingId === 'RALLY_POINT' && f.level > 0,
  );

  const marketPlace = currentVillage.buildingFields.find(
    (f) => f.buildingId === 'MARKETPLACE' && f.level > 0,
  );

  const { x, y } = tile.coordinates;

  const handleCenterMap = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('x', String(x));
    searchParams.set('y', String(y));
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const handleAddToFarmlist = async () => {
    if (farmLists.length > 0) {
      await addTileToFarmList({ farmListId: farmLists[0].id, tileId: tile.id });
      alert(t('Added to farmlist: {{name}}', { name: farmLists[0].name }));
    } else {
      alert(t('No farmlists found. Create one in the Rally Point first.'));
    }
  };

  const handleSendTroops = async () => {
    if (!rallyPoint) {
      return;
    }

    const params = new URLSearchParams({
      x: String(x),
      y: String(y),
    });

    if (isOasisTile(tile)) {
      // Oasis - use tile ID and attack type (backend detects oasis and handles occupation logic)
      params.set('targetId', String(tile.id));
      params.set('villageName', 'Oasis');
      params.set('playerName', tile.owner?.name ?? 'Nature');
      params.set('faction', tile.owner?.faction ?? 'nature');
      params.set('type', 'attack');
    } else if (
      isOccupiedOccupiableTile(tile) &&
      tile.ownerVillage &&
      tile.owner
    ) {
      params.set('targetId', String(tile.ownerVillage.id));
      params.set('villageName', tile.ownerVillage.name);
      params.set('playerName', tile.owner.name);
      params.set('faction', tile.owner.faction);
    } else {
      setIsResolvingRallyPointTarget(true);

      try {
        const village = await searchVillage(x, y);

        if (village) {
          params.set('targetId', String(village.id));
          params.set('villageName', village.name);
          params.set('playerName', village.player_name);
          params.set('faction', village.faction);
        }
      } finally {
        setIsResolvingRallyPointTarget(false);
      }
    }

    navigate(`${getRallyPointUrl(rallyPoint.id)}&${params.toString()}`);
  };

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xs border bg-muted/40 p-3 text-foreground shadow-sm backdrop-blur-xs">
      <div className="flex gap-2">
        {/* 1. Send Troops */}
        <Button
          size="sm"
          variant="outline"
          disabled={!rallyPoint || isResolvingRallyPointTarget}
          onClick={handleSendTroops}
          className="min-w-[120px] flex-1"
        >
          {isResolvingRallyPointTarget ? t('Loading...') : t('Send troops')}
        </Button>

        {/* 2. Send Merchants */}
        <Button
          size="sm"
          variant="outline"
          disabled={!marketPlace}
          onClick={() =>
            navigate(`${getMarketplaceUrl(marketPlace?.id ?? 0)}&x=${x}&y=${y}`)
          }
          className="min-w-[120px] flex-1"
        >
          {t('Send merchants')}
        </Button>
      </div>

      <div className="flex gap-2">
        {/* 3. Add to Farmlist */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddToFarmlist}
          disabled={isAddingToFarmList}
          className="min-w-[120px] flex-1"
        >
          {isAddingToFarmList ? t('Adding...') : t('Add to farmlist')}
        </Button>

        {/* 4. Center Map */}
        <DialogClose asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCenterMap}
            className="min-w-[120px] flex-1"
          >
            {t('Center map')}
          </Button>
        </DialogClose>
      </div>
    </div>
  );
};

export const TileDialog = ({ tile }: TileModalProps) => {
  if (!tile) {
    return null;
  }

  if (isOasisTile(tile)) {
    return (
      <DialogContent>
        <OasisTileModal tile={tile} />
      </DialogContent>
    );
  }

  if (isOccupiedOccupiableTile(tile)) {
    return (
      <DialogContent>
        <OccupiedOccupiableTileModal tile={tile} />
      </DialogContent>
    );
  }

  if (isOccupiableTile(tile)) {
    return (
      <DialogContent>
        <OccupiableTileModal tile={tile} />
      </DialogContent>
    );
  }

  return null;
};
