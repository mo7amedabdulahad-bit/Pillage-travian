export type ReportTag = 'read' | 'archived';

export type ReportType =
  | 'attack'
  | 'raid'
  | 'defence'
  | 'scout-attack'
  | 'scout-defence'
  | 'adventure'
  | 'trade';

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
