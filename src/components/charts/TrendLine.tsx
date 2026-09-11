"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatPeriod } from "@/lib/filters";
import type { TrendPoint } from "@/lib/types";

export function TrendLine({ data, height = 260 }: { data: TrendPoint[]; height?: number }) {
  const formatted = data.map((d) => ({ ...d, label: formatPeriod(d.period) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
        />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }} />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
        />
        <Line
          type="monotone"
          dataKey="plannedCalls"
          name="Planned calls"
          stroke="var(--baseline)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="actualCalls"
          name="Actual calls"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 0, fill: "var(--series-1)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
