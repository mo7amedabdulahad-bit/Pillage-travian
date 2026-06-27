import { match } from 'path-to-regexp';
import {
  adminAddResources,
  adminCancelEvent,
  adminCancelRetaliation,
  adminCreateNatarVillage,
  adminDeleteVillage,
  adminDowngradeBuilding,
  adminEndServer,
  adminGetIntegrityReport,
  adminGrantConstructionPlan,
  adminLevelUpHero,
  adminRemoveTroops,
  adminRenameVillage,
  adminResetServerEnd,
  adminSetGameSpeed,
  adminSetHeroHealth,
  adminSetNpcAggression,
  adminSetResources,
  adminSetWorldWonderLevel,
  adminSpawnHeroItem,
  adminSpawnTroops,
  adminStartWorldWonder,
  adminTeleportVillage,
  adminTriggerNpcBrainTick,
  adminUpgradeBuilding,
} from '../controllers/admin-action-controllers';
import {
  getAdminDashboardActivity,
  getAdminDashboardFactions,
  getAdminDashboardOverview,
  getAdminDashboardVillages,
} from '../controllers/admin-dashboard-controller';
import {
  adminGetEvents,
  adminGetHeroOverview,
  adminGetReports,
  adminGetUnits,
  adminGetVillageDetail,
  adminGetVillages,
  adminGetWorldWonders,
} from '../controllers/admin-read-controllers';
import {
  getBookmarks,
  updateBookmark,
} from '../controllers/bookmark-controllers';
import {
  getDeveloperSettings,
  getNpcVillageDebug,
  getNpcVillagesList,
  incrementHeroAdventurePoints,
  killHero,
  levelUpHero,
  spawnHeroItem,
  updateDeveloperSettings,
  updateVillageResources,
} from '../controllers/developer-tools-controllers';
import { getVillageEffects } from '../controllers/effect-controllers';
import {
  cancelConstructionEvent,
  createNewEvents,
  getVillageEvents,
  getVillageEventsByType,
} from '../controllers/event-controllers';
import {
  addTileToFarmList,
  createFarmList,
  deleteFarmList,
  getFarmList,
  getFarmLists,
  raidFarmList,
  raidFarmTile,
  removeTileFromFarmList,
  renameFarmList,
} from '../controllers/farm-list-controllers';
import {
  changeHeroAttributes,
  changeHeroResourceToProduce,
  equipHeroItem,
  getHero,
  getHeroAdventures,
  getHeroAppearance,
  getHeroInventory,
  getHeroLoadout,
  unequipHeroItem,
  updateHeroAppearance,
  useHeroItem,
} from '../controllers/hero-controllers';
import {
  addMapMarker,
  getMapMarkers,
  getTileOasisBonuses,
  getTiles,
  getTileTroops,
  getTileWorldItem,
  removeMapMarker,
} from '../controllers/map-controllers';
import {
  getMapFilters,
  updateMapFilter,
} from '../controllers/map-filters-controllers';
import { getTilesWithBonuses } from '../controllers/oasis-bonus-finder-controllers';
import {
  abandonOasis,
  cancelOasisRelease,
  occupyOasis,
} from '../controllers/oasis-controllers';
import {
  getMe,
  getPlayerBySlug,
  getPlayerVillageListing,
  getPlayerVillagesWithPopulation,
  getTroopsByVillage,
  renameVillage,
} from '../controllers/player-controllers';
import {
  getPreferences,
  updatePreference,
} from '../controllers/preferences-controllers';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from '../controllers/quest-controllers';
import {
  archiveReports,
  deleteReports,
  getReport,
  getReports,
  markReportsAsRead,
} from '../controllers/report-controllers';
import { getReputations } from '../controllers/reputation-controllers';
import { getServer } from '../controllers/server-controllers';
import {
  getGameWorldOverview,
  getPlayerRankings,
  getVillageRankings,
} from '../controllers/statistics-controllers';
import { getUnitImprovements } from '../controllers/unit-improvement-controllers';
import { getResearchedUnits } from '../controllers/unit-research-controllers';
import {
  getOccupiableOasisInRange,
  getVillageByCoords,
  getVillageBySlug,
} from '../controllers/village-controllers';
import { getArtifactsAroundVillage } from '../controllers/world-items-controllers';
import {
  getWorldWonder,
  getWorldWonderLeaderboard,
  renameWorldWonder,
  startWorldWonder,
  upgradeWorldWonder,
} from '../controllers/world-wonder-controllers';
import type { Route } from './route.ts';
import { createRoute } from './route.ts';

// NOTE: /player/:playerId/* is aliased to /me/*. In an actual server setting you'd get current user from session

const apiRoutes: Route[] = [
  // Server
  createRoute(getServer),

  // Developer Tools
  createRoute(getDeveloperSettings),
  createRoute(updateDeveloperSettings),
  createRoute(updateVillageResources),
  createRoute(spawnHeroItem),
  createRoute(levelUpHero),
  createRoute(incrementHeroAdventurePoints),
  createRoute(killHero),

  // NPC Brain Debug
  createRoute(getNpcVillagesList),
  createRoute(getNpcVillageDebug),

  // Admin Dashboard
  createRoute(getAdminDashboardOverview),
  createRoute(getAdminDashboardFactions),
  createRoute(getAdminDashboardVillages),
  createRoute(getAdminDashboardActivity),

  // Admin Read Endpoints
  createRoute(adminGetVillages),
  createRoute(adminGetVillageDetail),
  createRoute(adminGetHeroOverview),
  createRoute(adminGetEvents),
  createRoute(adminGetReports),
  createRoute(adminGetWorldWonders),
  createRoute(adminGetUnits),

  // Admin Actions
  createRoute(adminSpawnTroops as any),
  createRoute(adminRemoveTroops as any),
  createRoute(adminSetResources as any),
  createRoute(adminAddResources as any),
  createRoute(adminUpgradeBuilding as any),
  createRoute(adminDowngradeBuilding as any),
  createRoute(adminSpawnHeroItem as any),
  createRoute(adminSetHeroHealth as any),
  createRoute(adminLevelUpHero as any),
  createRoute(adminCreateNatarVillage as any),
  createRoute(adminGrantConstructionPlan as any),
  createRoute(adminStartWorldWonder as any),
  createRoute(adminSetWorldWonderLevel as any),
  createRoute(adminEndServer as any),
  createRoute(adminResetServerEnd as any),
  createRoute(adminTriggerNpcBrainTick as any),
  createRoute(adminSetGameSpeed as any),
  createRoute(adminSetNpcAggression as any),
  createRoute(adminCancelRetaliation as any),
  createRoute(adminCancelEvent as any),
  createRoute(adminTeleportVillage as any),
  createRoute(adminRenameVillage as any),
  createRoute(adminDeleteVillage as any),
  createRoute(adminGetIntegrityReport as any),

  // Auctions
  // createRoute(getAuctions),

  // Hero
  createRoute(getHero),
  createRoute(getHeroLoadout),
  createRoute(getHeroInventory),
  createRoute(getHeroAdventures),
  createRoute(useHeroItem),
  createRoute(equipHeroItem),
  createRoute(unequipHeroItem),
  createRoute(changeHeroAttributes),
  createRoute(changeHeroResourceToProduce),
  createRoute(getHeroAppearance),
  createRoute(updateHeroAppearance),

  // Unit Improvements
  createRoute(getUnitImprovements),

  // Quests
  createRoute(getQuests),
  createRoute(getCollectableQuestCount),
  createRoute(collectQuest),

  // Map
  createRoute(getTiles),
  createRoute(getTileTroops),
  createRoute(getTileOasisBonuses),
  createRoute(getTileWorldItem),
  createRoute(getMapMarkers),
  createRoute(addMapMarker),
  createRoute(removeMapMarker),

  // Farm List
  createRoute(getFarmLists),
  createRoute(createFarmList),
  createRoute(getFarmList),
  createRoute(deleteFarmList),
  createRoute(addTileToFarmList),
  createRoute(raidFarmList),
  createRoute(raidFarmTile),
  createRoute(removeTileFromFarmList),
  createRoute(renameFarmList),

  // Preferences
  createRoute(getPreferences),
  createRoute(updatePreference),

  // Events
  createRoute(createNewEvents),
  createRoute(cancelConstructionEvent),

  // Players
  createRoute(getMe),
  createRoute(getPlayerBySlug),
  createRoute(getPlayerVillageListing),
  createRoute(getPlayerVillagesWithPopulation),

  // Villages
  createRoute(getVillageBySlug),
  createRoute(getVillageByCoords),
  createRoute(getTroopsByVillage),
  createRoute(getVillageEffects),
  createRoute(getVillageEvents),
  createRoute(getVillageEventsByType),
  createRoute(renameVillage),
  createRoute(occupyOasis),
  createRoute(abandonOasis),
  createRoute(cancelOasisRelease),
  createRoute(getOccupiableOasisInRange),
  createRoute(getResearchedUnits),

  // Map Filters
  createRoute(getMapFilters),
  createRoute(updateMapFilter),

  // World Items
  createRoute(getArtifactsAroundVillage),

  // Bookmarks
  createRoute(getBookmarks),
  createRoute(updateBookmark),

  // Bonus Finder
  createRoute(getTilesWithBonuses),

  // Statistics
  createRoute(getPlayerRankings),
  createRoute(getVillageRankings),
  createRoute(getGameWorldOverview),

  // Reputations
  createRoute(getReputations),

  // Reports
  createRoute(getReports),
  createRoute(getReport),
  createRoute(markReportsAsRead),
  createRoute(deleteReports),
  createRoute(archiveReports),

  // World Wonder
  createRoute(getWorldWonder as any),
  createRoute(getWorldWonderLeaderboard as any),
  createRoute(startWorldWonder as any),
  createRoute(upgradeWorldWonder as any),
  createRoute(renameWorldWonder as any),
];

export const compiledApiRoutes = apiRoutes.map((route) => ({
  ...route,
  matcher: match(route.path, { decode: false }),
}));
