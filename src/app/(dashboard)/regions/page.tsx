import { FilterBar } from "@/components/FilterBar";
import { PlanVsActualBar } from "@/components/charts/PlanVsActualBar";
import { TrendLine } from "@/components/charts/TrendLine";
import {
  AchievementBadge,
  Card,
  PageHeader,
  TableWrap,
  formatCurrency,
  formatNumber,
} from "@/components/ui";
import { resolveFilter, type SearchParams } from "@/lib/filters";
import { getCallsTrend, getFilterOptions, getRegionSummary } from "@/lib/queries";

export default async function RegionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { periods, regions } = await getFilterOptions();
  const filter = resolveFilter(sp, periods);

  const [regionSummary, trend] = await Promise.all([
    getRegionSummary(filter),
    getCallsTrend(filter.regionId),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Plan vs actual — by region"
        description="Planned vs. executed field force calls, rolled up by region."
        actions={<FilterBar periods={periods} regions={regions} />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Card title="Calls: planned vs actual" subtitle="By region">
          <PlanVsActualBar
            data={regionSummary.map((r) => ({ label: r.regionName, planned: r.plannedCalls, actual: r.actualCalls }))}
          />
        </Card>

        <Card title="Trend" subtitle="Trailing 6 months across all periods, regardless of the period filter above">
          <TrendLine data={trend} />
        </Card>

        <Card title="Region detail" subtitle="Coverage, achievement, and engagement value">
          <TableWrap>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border-hairline text-left text-xs font-medium text-text-muted">
                  <th className="px-3 py-2.5">Region</th>
                  <th className="px-3 py-2.5 text-right">Planned calls</th>
                  <th className="px-3 py-2.5 text-right">Actual calls</th>
                  <th className="px-3 py-2.5">Achievement</th>
                  <th className="px-3 py-2.5 text-right">HCPs</th>
                  <th className="px-3 py-2.5 text-right">Field force</th>
                  <th className="px-3 py-2.5 text-right">Engagements</th>
                  <th className="px-3 py-2.5 text-right">Engagement value</th>
                </tr>
              </thead>
              <tbody>
                {regionSummary.map((r) => (
                  <tr key={r.regionId} className="border-b border-border-hairline last:border-0">
                    <td className="px-3 py-2.5 font-medium text-text-primary">{r.regionName}</td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(r.plannedCalls)}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(r.actualCalls)}
                    </td>
                    <td className="px-3 py-2.5">
                      <AchievementBadge pct={r.achievementPct} />
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">{r.hcpCount}</td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">{r.ffCount}</td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(r.engagementCount)}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-primary">
                      {formatCurrency(r.engagementValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>
    </div>
  );
}
