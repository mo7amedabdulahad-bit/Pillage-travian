import { useTranslation } from 'react-i18next';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import {
  isAttackTroopMovementEvent,
  isRaidTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isReturnTroopMovementEvent,
} from '@pillage-first/utils/guards/event';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useRallyPoint } from 'app/(game)/(village-slug)/hooks/use-rally-point';
import { HeroIcon } from 'app/components/hero-icon';
import { Text } from 'app/components/text';
import { TribeTroopIcon } from 'app/components/tribe-troop-icon';
import { Badge } from 'app/components/ui/badge';

const MovementRow = ({
  event,
  isOutgoing,
}: {
  event: TroopMovementEvent;
  isOutgoing: boolean;
}) => {
  const { t } = useTranslation();

  const getMovementLabel = () => {
    if (isAttackTroopMovementEvent(event)) {
      return t('Attack');
    }
    if (isRaidTroopMovementEvent(event)) {
      return t('Raid');
    }
    if (isReinforcementsTroopMovementEvent(event)) {
      return t('Reinforcement');
    }
    if (isReturnTroopMovementEvent(event)) {
      return t('Return');
    }
    return t('Movement');
  };

  const targetVillageLabel = isOutgoing
    ? `${t('Target')}: ${event.targetId}`
    : `${t('Source')}: ${event.villageId}`;

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-xs bg-muted/30">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={isOutgoing ? 'default' : 'destructive'}>
            {getMovementLabel()}
          </Badge>
          <Text className="font-semibold">{targetVillageLabel}</Text>
        </div>
        <div className="text-right">
          <Text
            size="sm"
            className="text-muted-foreground"
          >
            {t('Arrival')}:
          </Text>
          <Countdown
            endsAt={event.resolvesAt}
            className="font-mono font-bold"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-1">
        {event.troops.map((troop) => (
          <div
            key={troop.unitId}
            className="flex items-center gap-1 bg-background px-2 py-1 rounded-xs border border-border/50"
          >
            {troop.unitId === 'HERO' ? (
              <HeroIcon
                size="small"
                className="size-5"
              />
            ) : (
              <TribeTroopIcon
                unitId={troop.unitId}
                size="small"
                className="size-5"
              />
            )}
            <Text
              size="sm"
              className="font-medium"
            >
              {troop.amount}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RallyPointTroopMovements = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { movements } = useRallyPoint();

  const outgoing = movements.filter((m) => m.villageId === currentVillage.id);
  const incoming = movements.filter((m) => m.targetId === currentVillage.id);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="troop-movements" />
        <Text as="h2">{t('Troop movements')}</Text>

        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-3">
            <Text
              as="h3"
              className="border-b pb-1"
            >
              {t('Outgoing')}
            </Text>
            {outgoing.length === 0 ? (
              <Text className="italic text-muted-foreground">
                {t('No outgoing movements')}
              </Text>
            ) : (
              outgoing.map((m) => (
                <MovementRow
                  key={m.id}
                  event={m}
                  isOutgoing={true}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Text
              as="h3"
              className="border-b pb-1"
            >
              {t('Incoming')}
            </Text>
            {incoming.length === 0 ? (
              <Text className="italic text-muted-foreground">
                {t('No incoming movements')}
              </Text>
            ) : (
              incoming.map((m) => (
                <MovementRow
                  key={m.id}
                  event={m}
                  isOutgoing={false}
                />
              ))
            )}
          </div>
        </div>
      </SectionContent>
    </Section>
  );
};
