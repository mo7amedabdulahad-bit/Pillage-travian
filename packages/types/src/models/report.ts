export type ReportTag = 'read' | 'archived';

export type ReportType =
  | 'attack'
  | 'raid'
  | 'defence'
  | 'reinforcement'
  | 'scout-attack'
  | 'scout-defence'
  | 'adventure'
  | 'trade'
  | 'construction_plan_obtained'
  | 'npc_wonder_milestone'
  | 'world_wonder_level'
  | 'server_end';

export type Report = {
  id: number;
  type: ReportType;
  villageId: number;
  targetVillageId: number | null;
  timestamp: number;
  isRead: boolean;
  isArchived: boolean;
  attackerFactionId?: number | null;
  defenderFactionId?: number | null;
  // biome-ignore lint/suspicious/noExplicitAny: Report data is highly dynamic and varies by report type
  data?: any;
};
