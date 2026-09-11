import { prisma } from "@/lib/prisma";
import { ALL } from "@/lib/types";
import type {
  DashboardFilter,
  EngagementTypeBreakdown,
  FieldForceSummaryRow,
  FilterOptions,
  HcpEngagementRow,
  OverviewKpis,
  RegionSummaryRow,
  ShareMappingRow,
  TrendPoint,
} from "@/lib/types";

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // one decimal
}

function periodWhere(period: string) {
  return period === ALL ? {} : { period };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [periodRows, regions] = await Promise.all([
    prisma.callPlan.findMany({
      distinct: ["period"],
      select: { period: true },
      orderBy: { period: "asc" },
    }),
    prisma.region.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { periods: periodRows.map((p) => p.period), regions };
}

// ---------------------------------------------------------------------------
// Region summary: plan vs actual calls, engagement count/value, by region
// ---------------------------------------------------------------------------

export async function getRegionSummary(filter: DashboardFilter): Promise<RegionSummaryRow[]> {
  const regionWhere = filter.regionId === ALL ? {} : { id: filter.regionId };
  const regions = await prisma.region.findMany({
    where: regionWhere,
    orderBy: { name: "asc" },
    include: {
      fieldForce: { select: { id: true } },
      hcps: { select: { id: true } },
    },
  });

  const [plans, actuals, engagements] = await Promise.all([
    prisma.callPlan.groupBy({
      by: ["hcpId"],
      where: { ...periodWhere(filter.period), hcp: filter.regionId === ALL ? {} : { regionId: filter.regionId } },
      _sum: { plannedCalls: true },
    }),
    prisma.callActual.groupBy({
      by: ["hcpId"],
      where: { ...periodWhere(filter.period), hcp: filter.regionId === ALL ? {} : { regionId: filter.regionId } },
      _sum: { actualCalls: true },
    }),
    prisma.engagement.findMany({
      where: { ...periodWhere(filter.period), hcp: filter.regionId === ALL ? {} : { regionId: filter.regionId } },
      select: { count: true, value: true, hcp: { select: { regionId: true } } },
    }),
  ]);

  // Map hcpId -> regionId for plan/actual aggregation
  const hcpRegion = new Map<string, string>();
  for (const r of regions) {
    for (const h of r.hcps) hcpRegion.set(h.id, r.id);
  }

  const plannedByRegion = new Map<string, number>();
  for (const row of plans) {
    const regionId = hcpRegion.get(row.hcpId);
    if (!regionId) continue;
    plannedByRegion.set(regionId, (plannedByRegion.get(regionId) ?? 0) + (row._sum.plannedCalls ?? 0));
  }
  const actualByRegion = new Map<string, number>();
  for (const row of actuals) {
    const regionId = hcpRegion.get(row.hcpId);
    if (!regionId) continue;
    actualByRegion.set(regionId, (actualByRegion.get(regionId) ?? 0) + (row._sum.actualCalls ?? 0));
  }
  const engagementByRegion = new Map<string, { count: number; value: number }>();
  for (const e of engagements) {
    const regionId = e.hcp.regionId;
    const cur = engagementByRegion.get(regionId) ?? { count: 0, value: 0 };
    cur.count += e.count;
    cur.value += e.value;
    engagementByRegion.set(regionId, cur);
  }

  return regions.map((r) => {
    const plannedCalls = plannedByRegion.get(r.id) ?? 0;
    const actualCalls = actualByRegion.get(r.id) ?? 0;
    const eng = engagementByRegion.get(r.id) ?? { count: 0, value: 0 };
    return {
      regionId: r.id,
      regionName: r.name,
      plannedCalls,
      actualCalls,
      achievementPct: pct(actualCalls, plannedCalls),
      hcpCount: r.hcps.length,
      ffCount: r.fieldForce.length,
      engagementCount: eng.count,
      engagementValue: Math.round(eng.value),
    };
  });
}

// ---------------------------------------------------------------------------
// Trend: planned vs actual calls per period (optionally scoped to a region)
// ---------------------------------------------------------------------------

export async function getCallsTrend(regionId: string): Promise<TrendPoint[]> {
  const hcpWhere = regionId === ALL ? {} : { regionId };
  const [plans, actuals] = await Promise.all([
    prisma.callPlan.groupBy({
      by: ["period"],
      where: { hcp: hcpWhere },
      _sum: { plannedCalls: true },
      orderBy: { period: "asc" },
    }),
    prisma.callActual.groupBy({
      by: ["period"],
      where: { hcp: hcpWhere },
      _sum: { actualCalls: true },
      orderBy: { period: "asc" },
    }),
  ]);
  const actualMap = new Map(actuals.map((a) => [a.period, a._sum.actualCalls ?? 0]));
  return plans.map((p) => ({
    period: p.period,
    plannedCalls: p._sum.plannedCalls ?? 0,
    actualCalls: actualMap.get(p.period) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Field force summary: plan vs actual, engagement count/value, per FF
// ---------------------------------------------------------------------------

export async function getFieldForceSummary(filter: DashboardFilter): Promise<FieldForceSummaryRow[]> {
  const ffWhere = filter.regionId === ALL ? {} : { regionId: filter.regionId };
  const fieldForce = await prisma.fieldForce.findMany({
    where: ffWhere,
    include: {
      region: { select: { name: true } },
      hcps: { select: { id: true } },
      callPlans: { where: periodWhere(filter.period), select: { plannedCalls: true } },
      callActuals: { where: periodWhere(filter.period), select: { actualCalls: true } },
      engagements: { where: periodWhere(filter.period), select: { count: true, value: true } },
    },
    orderBy: { name: "asc" },
  });

  return fieldForce
    .map((ff) => {
      const plannedCalls = ff.callPlans.reduce((s, c) => s + c.plannedCalls, 0);
      const actualCalls = ff.callActuals.reduce((s, c) => s + c.actualCalls, 0);
      const engagementCount = ff.engagements.reduce((s, e) => s + e.count, 0);
      const engagementValue = ff.engagements.reduce((s, e) => s + e.value, 0);
      return {
        fieldForceId: ff.id,
        employeeCode: ff.employeeCode,
        name: ff.name,
        designation: ff.designation,
        regionName: ff.region.name,
        plannedCalls,
        actualCalls,
        achievementPct: pct(actualCalls, plannedCalls),
        hcpsCovered: ff.hcps.length,
        engagementCount,
        engagementValue: Math.round(engagementValue),
      };
    })
    .sort((a, b) => b.achievementPct - a.achievementPct);
}

// ---------------------------------------------------------------------------
// HCP engagement: count + value, plan vs actual calls, per HCP
// ---------------------------------------------------------------------------

export async function getHcpEngagementSummary(filter: DashboardFilter): Promise<HcpEngagementRow[]> {
  const hcpWhere = filter.regionId === ALL ? {} : { regionId: filter.regionId };
  const hcps = await prisma.hcp.findMany({
    where: hcpWhere,
    include: {
      region: { select: { name: true } },
      fieldForce: { select: { name: true } },
      callPlans: { where: periodWhere(filter.period), select: { plannedCalls: true } },
      callActuals: { where: periodWhere(filter.period), select: { actualCalls: true } },
      engagements: { where: periodWhere(filter.period), select: { count: true, value: true } },
    },
    orderBy: { name: "asc" },
  });

  return hcps
    .map((h) => {
      const plannedCalls = h.callPlans.reduce((s, c) => s + c.plannedCalls, 0);
      const actualCalls = h.callActuals.reduce((s, c) => s + c.actualCalls, 0);
      const engagementCount = h.engagements.reduce((s, e) => s + e.count, 0);
      const engagementValue = h.engagements.reduce((s, e) => s + e.value, 0);
      return {
        hcpId: h.id,
        name: h.name,
        specialty: h.specialty,
        tier: h.tier,
        regionName: h.region.name,
        fieldForceName: h.fieldForce.name,
        plannedCalls,
        actualCalls,
        achievementPct: pct(actualCalls, plannedCalls),
        engagementCount,
        engagementValue: Math.round(engagementValue),
      };
    })
    .sort((a, b) => b.engagementValue - a.engagementValue);
}

export async function getEngagementTypeBreakdown(filter: DashboardFilter): Promise<EngagementTypeBreakdown[]> {
  const hcpWhere = filter.regionId === ALL ? {} : { regionId: filter.regionId };
  const rows = await prisma.engagement.groupBy({
    by: ["type"],
    where: { ...periodWhere(filter.period), hcp: hcpWhere },
    _sum: { count: true, value: true },
  });
  return rows
    .map((r) => ({
      type: r.type,
      count: r._sum.count ?? 0,
      value: Math.round(r._sum.value ?? 0),
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// HCP / SKU / Chemist share mapping
// ---------------------------------------------------------------------------

export async function getShareMapping(filter: DashboardFilter): Promise<ShareMappingRow[]> {
  const hcpWhere = filter.regionId === ALL ? {} : { regionId: filter.regionId };
  const rows = await prisma.shareMapping.findMany({
    where: { ...periodWhere(filter.period), hcp: hcpWhere },
    include: {
      hcp: { select: { name: true, specialty: true, region: { select: { name: true } } } },
      sku: { select: { name: true, brand: true } },
      chemist: { select: { name: true } },
    },
  });

  // Aggregate across periods when "all" is selected (sum values, then re-derive share%).
  const key = (r: (typeof rows)[number]) => `${r.hcpId}|${r.skuId}|${r.chemistId}`;
  const grouped = new Map<
    string,
    {
      hcpId: string;
      hcpName: string;
      specialty: string;
      regionName: string;
      skuId: string;
      skuName: string;
      skuBrand: string;
      chemistId: string;
      chemistName: string;
      brandValue: number;
      marketValue: number;
    }
  >();
  for (const r of rows) {
    const k = key(r);
    const cur = grouped.get(k) ?? {
      hcpId: r.hcpId,
      hcpName: r.hcp.name,
      specialty: r.hcp.specialty,
      regionName: r.hcp.region.name,
      skuId: r.skuId,
      skuName: r.sku.name,
      skuBrand: r.sku.brand,
      chemistId: r.chemistId,
      chemistName: r.chemist.name,
      brandValue: 0,
      marketValue: 0,
    };
    cur.brandValue += r.brandValue;
    cur.marketValue += r.marketValue;
    grouped.set(k, cur);
  }

  const primaryLinks = await prisma.hcpChemistLink.findMany({
    where: { isPrimary: true },
    select: { hcpId: true, chemistId: true },
  });
  const primarySet = new Set(primaryLinks.map((l) => `${l.hcpId}|${l.chemistId}`));

  return Array.from(grouped.values())
    .map((g) => ({
      ...g,
      brandValue: Math.round(g.brandValue),
      marketValue: Math.round(g.marketValue),
      sharePct: pct(g.brandValue, g.marketValue),
      isPrimaryChemist: primarySet.has(`${g.hcpId}|${g.chemistId}`),
    }))
    .sort((a, b) => b.brandValue - a.brandValue);
}

// ---------------------------------------------------------------------------
// Overview KPIs
// ---------------------------------------------------------------------------

export async function getOverviewKpis(filter: DashboardFilter): Promise<OverviewKpis> {
  const hcpWhere = filter.regionId === ALL ? {} : { regionId: filter.regionId };

  const [plans, actuals, hcpCount, ffCount, engagements, shares] = await Promise.all([
    prisma.callPlan.aggregate({ where: { ...periodWhere(filter.period), hcp: hcpWhere }, _sum: { plannedCalls: true } }),
    prisma.callActual.aggregate({ where: { ...periodWhere(filter.period), hcp: hcpWhere }, _sum: { actualCalls: true } }),
    prisma.hcp.count({ where: hcpWhere }),
    prisma.fieldForce.count({ where: filter.regionId === ALL ? {} : { regionId: filter.regionId } }),
    prisma.engagement.aggregate({
      where: { ...periodWhere(filter.period), hcp: hcpWhere },
      _sum: { count: true, value: true },
    }),
    prisma.shareMapping.aggregate({
      where: { ...periodWhere(filter.period), hcp: hcpWhere },
      _sum: { brandValue: true, marketValue: true },
    }),
  ]);

  const plannedCalls = plans._sum.plannedCalls ?? 0;
  const actualCalls = actuals._sum.actualCalls ?? 0;

  return {
    plannedCalls,
    actualCalls,
    achievementPct: pct(actualCalls, plannedCalls),
    hcpCount,
    ffCount,
    engagementCount: engagements._sum.count ?? 0,
    engagementValue: Math.round(engagements._sum.value ?? 0),
    avgSharePct: pct(shares._sum.brandValue ?? 0, shares._sum.marketValue ?? 0),
  };
}
