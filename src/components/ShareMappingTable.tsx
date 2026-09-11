"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TableWrap, formatCurrency } from "@/components/ui";
import type { ShareMappingRow } from "@/lib/types";

export function ShareMappingTable({ rows }: { rows: ShareMappingRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.hcpName.toLowerCase().includes(q) ||
        r.skuName.toLowerCase().includes(q) ||
        r.skuBrand.toLowerCase().includes(q) ||
        r.chemistName.toLowerCase().includes(q) ||
        r.specialty.toLowerCase().includes(q) ||
        r.regionName.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search HCP, SKU, or chemist…"
          className="w-full rounded-lg border border-border-hairline bg-surface py-2 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--series-1)]"
        />
      </div>

      <p className="text-xs text-text-muted">
        {filtered.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} mappings
      </p>

      <TableWrap>
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-border-hairline text-left text-xs font-medium text-text-muted">
              <th className="px-3 py-2.5">HCP</th>
              <th className="px-3 py-2.5">SKU / brand</th>
              <th className="px-3 py-2.5">Chemist</th>
              <th className="px-3 py-2.5 text-right">Brand value</th>
              <th className="px-3 py-2.5 text-right">Market value</th>
              <th className="px-3 py-2.5">Brand share</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={`${r.hcpId}-${r.skuId}-${r.chemistId}`}
                className="border-b border-border-hairline last:border-0"
              >
                <td className="px-3 py-2.5">
                  <p className="font-medium text-text-primary">{r.hcpName}</p>
                  <p className="text-xs text-text-muted">{r.specialty} · {r.regionName}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-text-primary">{r.skuName}</p>
                  <p className="text-xs text-text-muted">{r.skuBrand}</p>
                </td>
                <td className="px-3 py-2.5 text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    {r.chemistName}
                    {r.isPrimaryChemist && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: "var(--series-1)",
                          background: "color-mix(in oklab, var(--series-1) 14%, transparent)",
                        }}
                      >
                        Primary
                      </span>
                    )}
                  </span>
                </td>
                <td className="tabular-nums px-3 py-2.5 text-right text-text-primary">
                  {formatCurrency(r.brandValue)}
                </td>
                <td className="tabular-nums px-3 py-2.5 text-right text-text-secondary">
                  {formatCurrency(r.marketValue)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--gridline)]">
                      <div
                        className="h-full rounded-full bg-[var(--series-1)]"
                        style={{ width: `${Math.min(100, r.sharePct)}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs text-text-secondary">{r.sharePct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
