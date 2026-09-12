import { FilterBar } from "@/components/FilterBar";
import { RankedBar } from "@/components/charts/RankedBar";
import {
  AchievementBadge,
  Card,
  KpiTile,
  PageHeader,
  TableWrap,
  formatCurrency,
  formatNumber,
  truncateLabel,
} from "@/components/ui";
import { resolveFilter, type SearchParams } from "@/lib/filters";
import {
  getEngagementTypeBreakdown,
  getFilterOptions,
  getHcpEngagementSummary,
} from "@/lib/queries";

const TIER_VAR: Record<string, string> = { A: "--series-6", B: "--series-4", C: "--text-muted" };

export default async function EngagementPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { periods, regions } = await getFilterOptions();
  const filter = resolveFilter(sp, periods);

  const [hcpRows, typeBreakdown] = await Promise.all([
    getHcpEngagementSummary(filter),
    getEngagementTypeBreakdown(filter),
  ]);

  const totalCount = hcpRows.reduce((s, r) => s + r.engagementCount, 0);
  const totalValue = hcpRows.reduce((s, r) => s + r.engagementValue, 0);
  const topByValue = hcpRows.slice(0, 10);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="HCP engagement"
        description="Engagement count and value per HCP — detailing, sampling, CME, RTM, group meetings."
        actions={<FilterBar periods={periods} regions={regions} />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Total engagements" value={formatNumber(totalCount)} accentVar="--series-1" />
          <KpiTile label="Total engagement value" value={formatCurrency(totalValue)} accentVar="--series-4" />
          <KpiTile label="HCPs engaged" value={formatNumber(hcpRows.filter((r) => r.engagementCount > 0).length)} accentVar="--series-3" />
          <KpiTile
            label="Avg. value / engagement"
            value={formatCurrency(totalCount ? Math.round(totalValue / totalCount) : 0)}
            accentVar="--series-7"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Top HCPs by engagement value" subtitle="Top 10">
            <RankedBar
              data={topByValue.map((h) => ({
                label: truncateLabel(h.name.replace(/^Dr\.\s*/, ""), 20),
                value: h.engagementValue,
              }))}
              seriesName="Engagement value"
              yAxisWidth={130}
            />
          </Card>
          <Card title="Engagement value by type">
            <RankedBar
              data={typeBreakdown.map((t) => ({ label: t.type, value: t.value }))}
              seriesName="Engagement value"
            />
          </Card>
        </div>

        <Card title="HCP detail" subtitle={`${hcpRows.length} HCPs`}>
          <TableWrap>
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border-hairline text-left text-xs font-medium text-text-muted">
                  <th className="px-3 py-2.5">HCP</th>
                  <th className="px-3 py-2.5">Specialty</th>
                  <th className="px-3 py-2.5">Tier</th>
                  <th className="px-3 py-2.5">Region / FF</th>
                  <th className="px-3 py-2.5">Calls achievement</th>
                  <th className="px-3 py-2.5 text-right">Engagements</th>
                  <th className="px-3 py-2.5 text-right">Engagement value</th>
                </tr>
              </thead>
              <tbody>
                {hcpRows.map((h) => (
                  <tr key={h.hcpId} className="border-b border-border-hairline last:border-0">
                    <td className="px-3 py-2.5 font-medium text-text-primary">{h.name}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{h.specialty}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ background: `var(${TIER_VAR[h.tier] ?? "--text-muted"})` }}
                      >
                        {h.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">
                      <span className="block">{h.regionName}</span>
                      <span className="block text-xs text-text-muted">{h.fieldForceName}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <AchievementBadge pct={h.achievementPct} />
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(h.engagementCount)}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-primary">
                      {formatCurrency(h.engagementValue)}
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
