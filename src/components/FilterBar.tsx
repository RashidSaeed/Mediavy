"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL } from "@/lib/types";
import { formatPeriod } from "@/lib/filters";

export function FilterBar({
  periods,
  regions,
}: {
  periods: string[];
  regions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") ?? periods[periods.length - 1] ?? ALL;
  const currentRegion = searchParams.get("region") ?? ALL;

  function update(key: "period" | "region", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Period"
        value={currentPeriod}
        onChange={(e) => update("period", e.target.value)}
        className="rounded-lg border border-border-hairline bg-surface px-3 py-2 text-sm font-medium text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--series-1)]"
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {formatPeriod(p)}
          </option>
        ))}
        <option value={ALL}>All periods (6 mo.)</option>
      </select>

      <select
        aria-label="Region"
        value={currentRegion}
        onChange={(e) => update("region", e.target.value)}
        className="rounded-lg border border-border-hairline bg-surface px-3 py-2 text-sm font-medium text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--series-1)]"
      >
        <option value={ALL}>All regions</option>
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
