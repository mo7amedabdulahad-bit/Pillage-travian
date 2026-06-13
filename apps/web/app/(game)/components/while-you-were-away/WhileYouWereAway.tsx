import './WhileYouWereAway.css';

interface AttackSummaryEntry {
  villageName: string;
  faction: string;
  outcome: 'defended' | 'defeated';
  troopsLost: number;
  resourcesLost?: { wood: number; clay: number; iron: number; wheat: number };
}

interface OfflineSummary {
  totalTimeSimulated: string;
  incomingAttacksResolved: AttackSummaryEntry[];
  npcVillagesGrown: number;
  nextThreatenedBy: string | null;
  nextEventIn: string | null;
}

interface WhileYouWereAwayProps {
  summary: OfflineSummary;
  onDismiss: () => void;
}

/**
 * "While You Were Away" summary modal displayed after offline simulation.
 * Shows what happened while the player was offline: attacks resolved,
 * villages grown, and next incoming threat.
 */
export const WhileYouWereAway = ({
  summary,
  onDismiss,
}: WhileYouWereAwayProps) => {
  const hasAttacks = summary.incomingAttacksResolved.length > 0;
  const defendedCount = summary.incomingAttacksResolved.filter(
    (a) => a.outcome === 'defended',
  ).length;
  const defeatedCount = summary.incomingAttacksResolved.filter(
    (a) => a.outcome === 'defeated',
  ).length;

  return (
    <div className="while-away-overlay">
      <div className="while-away-modal">
        <h2 className="while-away-title">While You Were Away...</h2>
        <p className="while-away-duration">
          Time simulated: <strong>{summary.totalTimeSimulated}</strong>
        </p>

        <div className="while-away-sections">
          {/* Attacks Section */}
          {hasAttacks && (
            <div className="while-away-section">
              <h3 className="while-away-section-title">
                Incoming Attacks ({summary.incomingAttacksResolved.length})
              </h3>
              <div className="while-away-stats">
                {defendedCount > 0 && (
                  <span className="while-away-stat while-away-stat--success">
                    {defendedCount} defended
                  </span>
                )}
                {defeatedCount > 0 && (
                  <span className="while-away-stat while-away-stat--danger">
                    {defeatedCount} defeated
                  </span>
                )}
              </div>
              <ul className="while-away-attack-list">
                {summary.incomingAttacksResolved.map((attack) => (
                  <li
                    key={`${attack.faction}-${attack.villageName}`}
                    className={`while-away-attack while-away-attack--${attack.outcome}`}
                  >
                    <span className="while-away-attack-faction">
                      {attack.faction}
                    </span>
                    <span className="while-away-attack-village">
                      {attack.villageName}
                    </span>
                    <span className="while-away-attack-outcome">
                      {attack.outcome === 'defended' ? 'Defended' : 'Defeated'}
                    </span>
                    <span className="while-away-attack-losses">
                      {attack.troopsLost} troops lost
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Growth Section */}
          {summary.npcVillagesGrown > 0 && (
            <div className="while-away-section">
              <h3 className="while-away-section-title">World Activity</h3>
              <p className="while-away-growth">
                {summary.npcVillagesGrown} NPC village
                {summary.npcVillagesGrown !== 1 ? 's' : ''} grew stronger
              </p>
            </div>
          )}

          {/* Next Threat Section */}
          {summary.nextThreatenedBy && (
            <div className="while-away-section while-away-section--warning">
              <h3 className="while-away-section-title">Next Threat</h3>
              <p className="while-away-threat">{summary.nextThreatenedBy}</p>
              {summary.nextEventIn && (
                <p className="while-away-timer">{summary.nextEventIn}</p>
              )}
            </div>
          )}

          {/* No Events */}
          {!hasAttacks &&
            summary.npcVillagesGrown === 0 &&
            !summary.nextThreatenedBy && (
              <div className="while-away-section">
                <p className="while-away-empty">
                  The world has been quiet. Your villages are safe.
                </p>
              </div>
            )}
        </div>

        <button
          type="button"
          className="while-away-button"
          onClick={onDismiss}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
