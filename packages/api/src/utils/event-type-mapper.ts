import type { GameEventType } from '@pillage-first/types/models/game-event';
import { adventurePointIncreaseResolver } from '../controllers/resolvers/adventure-resolvers';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from '../controllers/resolvers/building-resolvers';
import {
  heroHealthRegenerationResolver,
  heroRevivalResolver,
} from '../controllers/resolvers/hero-resolvers';
import {
  oasisReleaseResolver,
  oasisTickResolver,
} from '../controllers/resolvers/oasis-resolvers';
import {
  adventureMovementResolver,
  attackMovementResolver,
  findNewVillageMovementResolver,
  raidMovementResolver,
  reinforcementMovementResolver,
  relocationMovementResolver,
  returnMovementResolver,
} from '../controllers/resolvers/troop-movement-resolver';
import { troopTrainingEventResolver } from '../controllers/resolvers/troop-resolvers';
import { unitImprovementResolver } from '../controllers/resolvers/unit-improvement-resolvers';
import { unitResearchResolver } from '../controllers/resolvers/unit-research-resolvers';

export const getGameEventResolver = (gameEventType: GameEventType) => {
  switch (gameEventType) {
    case 'buildingLevelChange': {
      return buildingLevelChangeResolver;
    }
    case 'buildingConstruction': {
      return buildingConstructionResolver;
    }
    case 'buildingDestruction': {
      return buildingDestructionResolver;
    }
    case 'buildingScheduledConstruction': {
      return buildingScheduledConstructionEventResolver;
    }
    case 'troopTraining': {
      return troopTrainingEventResolver;
    }
    case 'troopMovementReinforcements': {
      return reinforcementMovementResolver;
    }
    case 'troopMovementRelocation': {
      return relocationMovementResolver;
    }
    case 'troopMovementReturn': {
      return returnMovementResolver;
    }
    case 'troopMovementFindNewVillage': {
      return findNewVillageMovementResolver;
    }
    case 'troopMovementAttack': {
      return attackMovementResolver;
    }
    case 'troopMovementRaid': {
      return raidMovementResolver;
    }
    case 'troopMovementAdventure': {
      return adventureMovementResolver;
    }
    case 'adventurePointIncrease': {
      return adventurePointIncreaseResolver;
    }
    case 'heroRevival': {
      return heroRevivalResolver;
    }
    case 'heroHealthRegeneration': {
      return heroHealthRegenerationResolver;
    }
    case 'oasisLoyaltyRegeneration': {
      return oasisTickResolver;
    }
    case 'oasisRelease': {
      return oasisReleaseResolver;
    }
    case 'unitResearch': {
      return unitResearchResolver;
    }
    case 'unitImprovement': {
      return unitImprovementResolver;
    }
    default: {
      console.error(`No resolver function set for event type ${gameEventType}`);

      return () => {};
    }
  }
};
