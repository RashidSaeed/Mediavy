import { FilterBar } from "@/components/FilterBar";
import { PlanVsActualBar } from "@/components/charts/PlanVsActualBar";
import { RankedBar } from "@/components/charts/RankedBar";
import { TrendLine } from "@/components/charts/TrendLine";
import { AchievementBadge, Card, KpiTile, PageHeader, formatCurrency, formatNumber } from "@/components/ui";
import { resolveFilter, type SearchParams } from "@/lib/filters";
import {
  getCallsTrend,
  getEngagementTypeBreakdown,
  getFieldForceSummary,
  getFilterOptions,
  getOverviewKpis,
  getRegionSummary,
} from "@/lib/queries";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { periods, regions } = await getFilterOptions();
  const filter = resolveFilter(sp, periods);

  const [kpis, regionSummary, ffSummary, trend, engagementTypes] = await Promise.all([
    getOverviewKpis(filter),
    getRegionSummary(filter),
    getFieldForceSummary(filter),
    getCallsTrend(filter.regionId),
    getEngagementTypeBreakdown(filter),
  ]);

  const topFF = ffSummary.slice(0, 5);
  const bottomFF = [...ffSummary].sort((a, b) => a.achievementPct - b.achievementPct).slice(0, 5);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Overview"
        description="Field force plan vs actual, HCP engagement, and brand share at a glance."
        actions={<FilterBar periods={periods} regions={regions} />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile
            label="Calls achievement"
            value={`${kpis.achievementPct}%`}
            sub={`${formatNumber(kpis.actualCalls)} of ${formatNumber(kpis.plannedCalls)} planned`}
            accentVar="--series-1"
          />
          <KpiTile
            label="HCP engagements"
            value={formatNumber(kpis.engagementCount)}
            sub={`across ${formatNumber(kpis.hcpCount)} HCPs`}
            accentVar="--series-3"
          />
          <KpiTile
            label="Engagement value"
            value={formatCurrency(kpis.engagementValue)}
            sub={`${formatNumber(kpis.ffCount)} field force reps`}
            accentVar="--series-4"
          />
          <KpiTile
            label="Avg. brand share"
            value={`${kpis.avgSharePct}%`}
            sub="HCP × SKU × chemist"
            accentVar="--series-7"
          />
        </div>

        <Card title="Planned vs actual calls" subtitle="Trailing 6 months">
          <TrendLine data={trend} />
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Calls by region" subtitle="Planned vs. actual">
            <PlanVsActualBar
              data={regionSummary.map((r) => ({ label: r.regionName, planned: r.plannedCalls, actual: r.actualCalls }))}
            />
          </Card>
          <Card title="Engagement value by type" subtitle="Detailing, sampling, CME, RTM, group meetings">
            <RankedBar
              data={engagementTypes.map((e) => ({ label: e.type, value: e.value }))}
              seriesName="Engagement value"
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Top field force reps" subtitle="By call achievement">
            <ul className="divide-y divide-[var(--gridline)]">
              {topFF.map((f) => (
                <li key={f.fieldForceId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{f.name}</p>
                    <p className="truncate text-xs text-text-muted">{f.regionName} · {f.employeeCode}</p>
                  </div>
                  <AchievementBadge pct={f.achievementPct} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Needs attention" subtitle="Lowest call achievement">
            <ul className="divide-y divide-[var(--gridline)]">
              {bottomFF.map((f) => (
                <li key={f.fieldForceId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{f.name}</p>
                    <p className="truncate text-xs text-text-muted">{f.regionName} · {f.employeeCode}</p>
                  </div>
                  <AchievementBadge pct={f.achievementPct} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
