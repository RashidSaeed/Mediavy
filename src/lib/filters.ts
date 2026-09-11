import { ALL } from "@/lib/types";
import type { DashboardFilter } from "@/lib/types";

export type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Resolve the active filter from the URL's ?period=&region= params, defaulting
 * period to the most recent available period and region to "all". */
export function resolveFilter(sp: SearchParams, periods: string[]): DashboardFilter {
  const latest = periods[periods.length - 1] ?? ALL;
  const period = first(sp.period) ?? latest;
  const regionId = first(sp.region) ?? ALL;
  return {
    period: periods.includes(period) || period === ALL ? period : latest,
    regionId,
  };
}

export function formatPeriod(period: string): string {
  if (period === ALL) return "All periods";
  const [y, m] = period.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
