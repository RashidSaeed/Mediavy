import { FilterBar } from "@/components/FilterBar";
import { PlanVsActualBar } from "@/components/charts/PlanVsActualBar";
import {
  AchievementBadge,
  Card,
  PageHeader,
  TableWrap,
  formatCurrency,
  formatNumber,
} from "@/components/ui";
import { resolveFilter, type SearchParams } from "@/lib/filters";
import { getFieldForceSummary, getFilterOptions } from "@/lib/queries";

export default async function FieldForcePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { periods, regions } = await getFilterOptions();
  const filter = resolveFilter(sp, periods);

  const ffSummary = await getFieldForceSummary(filter);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Plan vs actual — by field force"
        description="Each rep's planned vs. executed calls, HCP coverage, and engagement value."
        actions={<FilterBar periods={periods} regions={regions} />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Card title="Calls: planned vs actual" subtitle="Top 12 by planned calls">
          <PlanVsActualBar
            data={[...ffSummary]
              .sort((a, b) => b.plannedCalls - a.plannedCalls)
              .slice(0, 12)
              .map((f) => ({ label: f.name.replace(/^Dr\.\s*/, ""), planned: f.plannedCalls, actual: f.actualCalls }))}
            height={340}
          />
        </Card>

        <Card title="Field force detail" subtitle={`${ffSummary.length} reps`}>
          <TableWrap>
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border-hairline text-left text-xs font-medium text-text-muted">
                  <th className="px-3 py-2.5">Rep</th>
                  <th className="px-3 py-2.5">Region</th>
                  <th className="px-3 py-2.5 text-right">HCPs covered</th>
                  <th className="px-3 py-2.5 text-right">Planned calls</th>
                  <th className="px-3 py-2.5 text-right">Actual calls</th>
                  <th className="px-3 py-2.5">Achievement</th>
                  <th className="px-3 py-2.5 text-right">Engagements</th>
                  <th className="px-3 py-2.5 text-right">Engagement value</th>
                </tr>
              </thead>
              <tbody>
                {ffSummary.map((f) => (
                  <tr key={f.fieldForceId} className="border-b border-border-hairline last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-text-primary">{f.name}</p>
                      <p className="text-xs text-text-muted">{f.employeeCode} · {f.designation}</p>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">{f.regionName}</td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">{f.hcpsCovered}</td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(f.plannedCalls)}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(f.actualCalls)}
                    </td>
                    <td className="px-3 py-2.5">
                      <AchievementBadge pct={f.achievementPct} />
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                      {formatNumber(f.engagementCount)}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-right text-text-primary">
                      {formatCurrency(f.engagementValue)}
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
