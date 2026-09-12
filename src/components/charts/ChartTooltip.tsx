"use client";

import type { TooltipContentProps } from "recharts";

/** Shared tooltip look: surface card, secondary-ink labels, primary-ink values,
 * a color swatch per series (never color-only — the label always names it). */
export function ChartTooltip({
  active,
  payload,
  label,
}: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border-hairline bg-surface-raised px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1.5 font-medium text-text-primary">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="tabular-nums font-medium text-text-primary">
              {typeof entry.value === "number" ? entry.value.toLocaleString("en-US") : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
