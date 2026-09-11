export const ALL = "all";

export type DashboardFilter = {
  /** "YYYY-MM" or ALL to aggregate across every seeded period. */
  period: string;
  /** Region id or ALL. */
  regionId: string;
};

export type FilterOptions = {
  periods: string[]; // chronological, oldest first
  regions: { id: string; name: string }[];
};

export type RegionSummaryRow = {
  regionId: string;
  regionName: string;
  plannedCalls: number;
  actualCalls: number;
  achievementPct: number;
  hcpCount: number;
  ffCount: number;
  engagementCount: number;
  engagementValue: number;
};

export type FieldForceSummaryRow = {
  fieldForceId: string;
  employeeCode: string;
  name: string;
  designation: string;
  regionName: string;
  plannedCalls: number;
  actualCalls: number;
  achievementPct: number;
  hcpsCovered: number;
  engagementCount: number;
  engagementValue: number;
};

export type TrendPoint = {
  period: string;
  plannedCalls: number;
  actualCalls: number;
};

export type HcpEngagementRow = {
  hcpId: string;
  name: string;
  specialty: string;
  tier: string;
  regionName: string;
  fieldForceName: string;
  plannedCalls: number;
  actualCalls: number;
  achievementPct: number;
  engagementCount: number;
  engagementValue: number;
};

export type EngagementTypeBreakdown = {
  type: string;
  count: number;
  value: number;
};

export type ShareMappingRow = {
  hcpId: string;
  hcpName: string;
  specialty: string;
  regionName: string;
  skuId: string;
  skuName: string;
  skuBrand: string;
  chemistId: string;
  chemistName: string;
  isPrimaryChemist: boolean;
  brandValue: number;
  marketValue: number;
  sharePct: number;
};

export type OverviewKpis = {
  plannedCalls: number;
  actualCalls: number;
  achievementPct: number;
  hcpCount: number;
  ffCount: number;
  engagementCount: number;
  engagementValue: number;
  avgSharePct: number;
};
