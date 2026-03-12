"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";

interface RetentionDataPoint {
  label: string;
  value: number;
  pct: number;
}

interface VideoRetentionCurveProps {
  data: RetentionDataPoint[];
}

function interpolateRetentionColor(pct: number): string {
  // Green (#22C55E) at 100% retention, Red (#EF4444) at 0%
  const t = Math.max(0, Math.min(1, pct / 100));
  const r = Math.round(0xef + (0x22 - 0xef) * t);
  const g = Math.round(0x44 + (0xc5 - 0x44) * t);
  const b = Math.round(0x44 + (0x5e - 0x44) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function VideoRetentionCurve({ data }: VideoRetentionCurveProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid
          stroke="#1F1F23"
          strokeDasharray="none"
          vertical={false}
        />

        <XAxis
          dataKey="label"
          tick={{ fill: "#71717A", fontSize: 12 }}
          axisLine={{ stroke: "#1F1F23" }}
          tickLine={false}
        />

        <YAxis
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fill: "#71717A", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          width={48}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#18181B",
            border: "1px solid #27272A",
            borderRadius: 8,
            color: "#F4F4F5",
            fontSize: 13,
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _: any, props: any) => {
            const p = props?.payload as RetentionDataPoint | undefined;
            return [`${p?.pct ?? 0}% (${Number(value).toLocaleString()})`, "Retention"];
          }}
        />

        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={interpolateRetentionColor(entry.pct)}
            />
          ))}
          <LabelList
            dataKey="pct"
            position="top"
            formatter={(v: unknown) => `${v}%`}
            style={{ fill: "#71717A", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
