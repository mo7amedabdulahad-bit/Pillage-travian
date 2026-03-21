import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { unitsMap } from '@pillage-first/game-assets/units';
import type {
  ScoutMode,
  TroopMovementEventType,
} from '@pillage-first/types/models/game-event';
import type { UnitId } from '@pillage-first/types/models/unit';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ReputationBadge } from 'app/(game)/(village-slug)/components/reputation-badge';
import { useRallyPoint } from 'app/(game)/(village-slug)/hooks/use-rally-point';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { HeroIcon } from 'app/components/hero-icon';
import { Text } from 'app/components/text';
import { TribeTroopIcon } from 'app/components/tribe-troop-icon';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { Label } from 'app/components/ui/label';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';

type Step = 'input' | 'confirm';

interface VillageSearchResult {
  id: number;
  name: string;
  player_name: string;
  faction: string;
}

export const RallyPointSendTroops = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { deployableTroops, searchVillage, sendTroops, isSending } =
    useRallyPoint();
  const { getReputation } = useReputations();
  const [step, setStep] = useState<Step>('input');
  const [targetName, setTargetName] = useState('');
  const [targetPlayerName, setTargetPlayerName] = useState('');
  const [targetX, setTargetX] = useState('');
  const [targetY, setTargetY] = useState('');
  const [troopAmounts, setTroopAmounts] = useState<Record<string, string>>({});
  const [movementType, setMovementType] = useState<TroopMovementEventType>(
    'troopMovementAttack',
  );
  const [targetVillage, setTargetVillage] =
    useState<VillageSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMapPrefilledTargetLocked, setIsMapPrefilledTargetLocked] =
    useState(false);
  const [scoutMode, setScoutMode] = useState<ScoutMode>('resource');

  const isScoutsOnly = Object.entries(troopAmounts).every(
    ([unitId, amount]) => {
      if (Number(amount) === 0) {
        return true;
      }
      return unitsMap.get(unitId as UnitId)?.tier === 'scout';
    },
  );

  // Target Reputation Logic
  const faction = targetVillage?.faction;
  const reputation = faction
    ? getReputation(
        faction as
          | 'player'
          | 'npc1'
          | 'npc2'
          | 'npc3'
          | 'npc4'
          | 'npc5'
          | 'npc6'
          | 'npc7'
          | 'npc8',
      )
    : null;
  const isAlly =
    reputation?.reputationLevel &&
    ['ecstatic', 'honored', 'respected', 'friendly', 'player'].includes(
      reputation.reputationLevel,
    );
  const canReinforce = !!isAlly;
  const canAttack = !isAlly;

  useEffect(() => {
    const x = searchParams.get('x');
    const y = searchParams.get('y');
    const targetId = searchParams.get('targetId');
    const villageName = searchParams.get('villageName');
    const playerName = searchParams.get('playerName');
    const faction = searchParams.get('faction');

    setTargetX(x ?? '');
    setTargetY(y ?? '');

    if (targetId && villageName && playerName) {
      setTargetName(villageName);
      setTargetPlayerName(playerName);
      setTargetVillage({
        id: Number(targetId),
        name: villageName,
        player_name: playerName,
        faction: faction ?? 'nature',
      });
      setIsMapPrefilledTargetLocked(true);
    } else {
      setTargetVillage(null);
      setTargetName('');
      setTargetPlayerName('');
      setIsMapPrefilledTargetLocked(false);
    }

    const type = searchParams.get('type');
    // Initial movement type from URL
    if (type === 'attack') {
      setMovementType('troopMovementAttack');
    } else if (type === 'raid') {
      setMovementType('troopMovementRaid');
    } else if (type === 'reinforce') {
      setMovementType('troopMovementReinforcements');
    }
  }, [searchParams]);

  const unlockPrefilledTarget = () => {
    if (!isMapPrefilledTargetLocked) {
      return;
    }

    setIsMapPrefilledTargetLocked(false);
    setTargetVillage(null);
    setTargetName('');
    setTargetPlayerName('');
  };

  // Adjust mission type based on reputation when target is found
  useEffect(() => {
    if (canReinforce && movementType !== 'troopMovementReinforcements') {
      setMovementType('troopMovementReinforcements');
    } else if (
      !canReinforce &&
      movementType === 'troopMovementReinforcements'
    ) {
      setMovementType('troopMovementAttack');
    }
  }, [canReinforce, movementType]);

  const handleNext = async () => {
    if (isMapPrefilledTargetLocked && targetVillage) {
      setStep('confirm');
      return;
    }

    setIsSearching(true);
    try {
      let village: VillageSearchResult | null = null;
      if (targetX && targetY) {
        village = await searchVillage(Number(targetX), Number(targetY));
      } else if (targetName) {
        village = await searchVillage(undefined, undefined, targetName);
      } else {
        setIsSearching(false);
        return;
      }

      if (!village) {
        alert(t('Village not found'));
        setIsSearching(false);
        return;
      }

      setTargetVillage(village);
      setTargetName(village.name);
      setTargetPlayerName(village.player_name);
      setStep('confirm');
    } catch (_e) {
      alert(t('Village not found'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!targetVillage) {
      return;
    }

    const troops = Object.entries(troopAmounts)
      .filter(([_, amount]) => Number(amount) > 0)
      .map(([unitId, amount]) => {
        const troop = deployableTroops.find((item) => item.unitId === unitId);

        if (!troop) {
          return null;
        }

        return {
          unitId,
          amount: Number(amount),
          tileId: troop.tileId,
          source: troop.source,
        };
      })
      .filter((troop) => troop !== null);

    if (troops.length === 0) {
      return;
    }

    await sendTroops({
      targetId: targetVillage.id,
      type: movementType,
      troops,
      scoutMode: isScoutsOnly ? scoutMode : undefined,
    });

    setStep('input');
    setTroopAmounts({});
    setTargetX('');
    setTargetY('');
    setTargetName('');
    setTargetPlayerName('');
    setTargetVillage(null);
    setIsMapPrefilledTargetLocked(false);
  };

  const adjustTroops = (unitId: string, delta: number, max: number) => {
    const current = Number(troopAmounts[unitId] || 0);
    const newValue = Math.min(max, Math.max(0, current + delta));
    setTroopAmounts((prev) => ({ ...prev, [unitId]: String(newValue) }));
  };

  if (step === 'confirm') {
    return (
      <Section>
        <SectionContent>
          <Bookmark tab="send-troops" />
          <Text as="h2">{t('Confirm troop movement')}</Text>
          <div className="flex flex-col gap-4 p-4 border rounded-xs bg-muted/30">
            <div>
              <div className="flex items-center gap-2">
                <Text className="font-bold">
                  {t('Target')}: {targetVillage?.name}
                </Text>
                {reputation && (
                  <ReputationBadge level={reputation.reputationLevel} />
                )}
              </div>
              <Text className="text-muted-foreground">
                {t('Player')}: {targetVillage?.player_name}
              </Text>
              <Text className="text-sm italic">
                {t('Type')}: {t(`TroopMovementEventType.${movementType}`)}
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text className="font-semibold">{t('Troops to send')}:</Text>
              <div className="flex flex-wrap gap-3">
                {Object.entries(troopAmounts)
                  .filter(([_, a]) => Number(a) > 0)
                  .map(([unitId, amount]) => (
                    <div
                      key={unitId}
                      className="flex items-center gap-1 bg-background px-2 py-1 rounded-xs border"
                    >
                      {unitId === 'HERO' ? (
                        <HeroIcon
                          size="small"
                          className="size-5"
                        />
                      ) : (
                        <TribeTroopIcon
                          unitId={unitId}
                          size="small"
                          className="size-5"
                        />
                      )}
                      <Text>{amount}</Text>
                    </div>
                  ))}
              </div>
            </div>
            {isScoutsOnly && (
              <div className="flex flex-col gap-2">
                <Text className="font-semibold">
                  {t('Scout mission type')}:
                </Text>
                <RadioGroup
                  value={scoutMode}
                  onValueChange={(v) => setScoutMode(v as ScoutMode)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="resource"
                      id="scout-resource"
                    />
                    <Label
                      htmlFor="scout-resource"
                      className="text-base cursor-pointer"
                    >
                      {t('Scout Resources')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="defence"
                      id="scout-defence"
                    />
                    <Label
                      htmlFor="scout-defence"
                      className="text-base cursor-pointer"
                    >
                      {t('Scout Defences')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
              >
                {t('Back')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSending}
              >
                {isSending ? t('Sending...') : t('Confirm')}
              </Button>
            </div>
          </div>
        </SectionContent>
      </Section>
    );
  }

  // Only show units that the player HAS
  const availableTroops = deployableTroops.filter((t) => t.amount > 0);

  // Send button disabled logic
  const isSendDisabled = isSearching || ((!targetX || !targetY) && !targetName);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="send-troops" />
        <Text as="h2">{t('Send units')}</Text>

        {/* Troop Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 mt-6">
          {availableTroops.map((troop) => (
            <div
              key={troop.unitId}
              className="flex items-center gap-2"
            >
              {troop.unitId === 'HERO' ? (
                <HeroIcon
                  size="small"
                  className="size-6 shrink-0"
                />
              ) : (
                <TribeTroopIcon
                  unitId={troop.unitId}
                  size="small"
                  className="size-6 shrink-0"
                />
              )}

              <div className="flex items-center border rounded-xs overflow-hidden h-8 bg-background">
                <button
                  type="button"
                  onClick={() => adjustTroops(troop.unitId, -1, troop.amount)}
                  className="px-2 hover:bg-gray-100 border-r text-gray-500 font-bold h-full"
                >
                  -
                </button>
                <Input
                  type="number"
                  min="0"
                  max={troop.amount}
                  placeholder="0"
                  value={troopAmounts[troop.unitId] || ''}
                  onChange={(e) =>
                    setTroopAmounts({
                      ...troopAmounts,
                      [troop.unitId]: e.target.value,
                    })
                  }
                  className="w-16 h-full px-1 text-center border-none shadow-none focus-visible:ring-0"
                />
                <button
                  type="button"
                  onClick={() => adjustTroops(troop.unitId, 1, troop.amount)}
                  className="px-2 hover:bg-gray-100 border-l text-gray-500 font-bold h-full"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTroopAmounts({
                    ...troopAmounts,
                    [troop.unitId]: String(troop.amount),
                  })
                }
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                ( {troop.amount} )
              </button>
            </div>
          ))}
          {availableTroops.length === 0 && (
            <Text className="col-span-full italic text-muted-foreground">
              {t('No troops available in this village.')}
            </Text>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 mt-10">
          {/* Targeting Section */}
          <div className="flex-1 p-4 bg-muted/30 border rounded-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="village-name"
                className="w-16 shrink-0"
              >
                {t('Village')}:
              </Label>
              <Input
                id="village-name"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                readOnly={isMapPrefilledTargetLocked}
                className="flex-1 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="player-name"
                className="w-16 shrink-0"
              >
                {t('Player')}:
              </Label>
              <Input
                id="player-name"
                value={targetPlayerName}
                readOnly
                className="flex-1 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 italic text-sm text-muted-foreground">
                {t('or')}
              </span>
              <Label htmlFor="x">X:</Label>
              <Input
                id="x"
                value={targetX}
                onChange={(e) => {
                  unlockPrefilledTarget();
                  setTargetX(e.target.value);
                }}
                className="w-16 h-8 text-center"
              />
              <Label htmlFor="y">Y:</Label>
              <Input
                id="y"
                value={targetY}
                onChange={(e) => {
                  unlockPrefilledTarget();
                  setTargetY(e.target.value);
                }}
                className="w-16 h-8 text-center"
              />
            </div>
          </div>

          {/* Mission Selection */}
          <div className="flex-1 flex flex-col gap-3 justify-center">
            <RadioGroup
              value={movementType}
              onValueChange={(v) =>
                setMovementType(v as TroopMovementEventType)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="troopMovementReinforcements"
                  id="reinforcements"
                  disabled={!canReinforce}
                />
                <Label
                  htmlFor="reinforcements"
                  className={clsx(
                    'text-base cursor-pointer',
                    !canReinforce && 'opacity-40 grayscale strike',
                  )}
                >
                  {t('Reinforcement')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="troopMovementAttack"
                  id="attack"
                  disabled={!canAttack}
                />
                <Label
                  htmlFor="attack"
                  className={clsx(
                    'text-base cursor-pointer',
                    !canAttack && 'opacity-40 grayscale strike',
                  )}
                >
                  {t('Attack: Normal')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="troopMovementRaid"
                  id="raid"
                  disabled={!canAttack}
                />
                <Label
                  htmlFor="raid"
                  className={clsx(
                    'text-base cursor-pointer',
                    !canAttack && 'opacity-40 grayscale strike',
                  )}
                >
                  {t('Attack: Raid')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleNext}
            disabled={isSendDisabled}
            className="bg-[#689926] hover:bg-[#5a8320] text-white px-8 py-6 text-lg rounded-sm"
          >
            {isSearching ? t('Searching...') : t('Send')}
          </Button>
        </div>
      </SectionContent>
    </Section>
  );
};
