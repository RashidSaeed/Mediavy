"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

export function RankedBar({
  data,
  seriesName,
  height,
  yAxisWidth = 120,
}: {
  data: { label: string; value: number }[];
  seriesName: string;
  height?: number;
  yAxisWidth?: number;
}) {
  const resolvedHeight = height ?? Math.max(200, data.length * 36);
  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barCategoryGap="24%"
      >
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={yAxisWidth}
          interval={0}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--gridline)", opacity: 0.5 }} />
        <Bar
          dataKey="value"
          name={seriesName}
          fill="var(--series-1)"
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
