import { useTranslation } from 'react-i18next';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Text } from 'app/components/text';

const FACTION_LABELS: Record<string, string> = {
  natars: 'Natars',
  romans: 'Romans',
  teutons: 'Teutons',
  gauls: 'Gauls',
  egyptians: 'Egyptians',
  huns: 'Huns',
  spartans: 'Spartans',
  vikings: 'Vikings',
};

/**
 * Full-screen overlay shown when the game has ended (WW reached Level 20).
 * Displays Victory or Defeat depending on who won.
 */
export const GameResultScreen = () => {
  const { t } = useTranslation();
  const { server } = useServer();

  if (!server.endedAt) {
    return null;
  }

  const isVictory = server.winnerType === 'player';
  const endedDate = new Date(server.endedAt).toLocaleString();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-lg w-full rounded-lg border border-border bg-card p-8 shadow-2xl">
        {isVictory ? (
          <>
            <div className="text-center mb-6">
              <Text
                as="h1"
                className="text-3xl font-bold text-yellow-400 mb-2"
              >
                {t('Victory!')}
              </Text>
              <Text className="text-muted-foreground">
                {t('Your faction has won the game!')}
              </Text>
            </div>

            <div className="space-y-4 mb-6">
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4">
                <Text className="text-sm text-muted-foreground mb-1">
                  {t('World Wonder completed')}
                </Text>
                <Text className="font-semibold text-yellow-400">
                  Level 20 achieved
                </Text>
              </div>

              {server.winnerPlayerId && (
                <div className="rounded-md border border-border p-4">
                  <Text className="text-sm text-muted-foreground mb-1">
                    {t('Winner')}
                  </Text>
                  <Text className="font-semibold">
                    {t('Player')} #{server.winnerPlayerId}
                  </Text>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <Text
                as="h1"
                className="text-3xl font-bold text-red-400 mb-2"
              >
                {t('Defeat')}
              </Text>
              <Text className="text-muted-foreground">
                {t('The Natars have won the game.')}
              </Text>
            </div>

            <div className="space-y-4 mb-6">
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
                <Text className="text-sm text-muted-foreground mb-1">
                  {t('World Wonder completed by')}
                </Text>
                <Text className="font-semibold text-red-400">
                  {FACTION_LABELS.natars || 'Natars'}
                </Text>
              </div>
            </div>
          </>
        )}

        <div className="text-center">
          <Text className="text-sm text-muted-foreground">
            {t('Game ended')}:{' '}
            <span className="font-medium text-foreground">{endedDate}</span>
          </Text>
        </div>

        <div className="text-center mt-6">
          <Text className="text-xs text-muted-foreground italic">
            {t('This server has ended. Thank you for playing!')}
          </Text>
        </div>
      </div>
    </div>
  );
};
