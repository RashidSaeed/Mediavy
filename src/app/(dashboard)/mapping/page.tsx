import { FilterBar } from "@/components/FilterBar";
import { RankedBar } from "@/components/charts/RankedBar";
import { ShareMappingTable } from "@/components/ShareMappingTable";
import { Card, KpiTile, PageHeader, formatCurrency, truncateLabel } from "@/components/ui";
import { resolveFilter, type SearchParams } from "@/lib/filters";
import { getFilterOptions, getShareMapping } from "@/lib/queries";

function topByBrandValue(rows: { key: string; brandValue: number }[], limit: number) {
  const byKey = new Map<string, number>();
  for (const r of rows) byKey.set(r.key, (byKey.get(r.key) ?? 0) + r.brandValue);
  return Array.from(byKey.entries())
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export default async function MappingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { periods, regions } = await getFilterOptions();
  const filter = resolveFilter(sp, periods);

  const rows = await getShareMapping(filter);

  const totalBrandValue = rows.reduce((s, r) => s + r.brandValue, 0);
  const totalMarketValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const avgSharePct = totalMarketValue ? Math.round((totalBrandValue / totalMarketValue) * 1000) / 10 : 0;
  const uniqueHcps = new Set(rows.map((r) => r.hcpId)).size;
  const uniqueChemists = new Set(rows.map((r) => r.chemistId)).size;

  const bySku = topByBrandValue(
    rows.map((r) => ({ key: r.skuName, brandValue: r.brandValue })),
    8
  ).map((d) => ({ ...d, label: truncateLabel(d.label, 20) }));
  const byChemist = topByBrandValue(
    rows.map((r) => ({ key: r.chemistName, brandValue: r.brandValue })),
    8
  ).map((d) => ({ ...d, label: truncateLabel(d.label, 20) }));

  return (
    <div className="flex flex-col">
      <PageHeader
        title="HCP / SKU / Chemist mapping"
        description="Which chemists fulfil each HCP's prescriptions, by SKU, with our brand's value share."
        actions={<FilterBar periods={periods} regions={regions} />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Brand value" value={formatCurrency(Math.round(totalBrandValue))} accentVar="--series-1" />
          <KpiTile label="Market value" value={formatCurrency(Math.round(totalMarketValue))} accentVar="--baseline" />
          <KpiTile label="Avg. brand share" value={`${avgSharePct}%`} accentVar="--series-7" />
          <KpiTile label="HCPs × chemists mapped" value={`${uniqueHcps} × ${uniqueChemists}`} accentVar="--series-3" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Brand value by SKU" subtitle="Top 8">
            <RankedBar data={bySku} seriesName="Brand value" height={280} />
          </Card>
          <Card title="Brand value by chemist" subtitle="Top 8">
            <RankedBar data={byChemist} seriesName="Brand value" height={280} />
          </Card>
        </div>

        <Card title="HCP × SKU × Chemist detail" subtitle="Search across HCP, SKU, brand, chemist, or region">
          <ShareMappingTable rows={rows} />
        </Card>
      </div>
    </div>
  );
}
