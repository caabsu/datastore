"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueDataPoint {
  date: string;
  revenue: number;
  spend: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function formatDollar(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          stroke="#1F1F23"
          strokeDasharray="none"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: "#71717A", fontSize: 12 }}
          axisLine={{ stroke: "#1F1F23" }}
          tickLine={false}
        />

        <YAxis
          tickFormatter={formatDollar}
          tick={{ fill: "#71717A", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#18181B",
            border: "1px solid #27272A",
            borderRadius: 8,
            color: "#F4F4F5",
            fontSize: 13,
          }}
          labelStyle={{ color: "#71717A", marginBottom: 4 }}
          formatter={(value: any, name: any) => [
            formatDollar(value),
            name === "revenue" ? "Revenue" : "Spend",
          ]}
        />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#22C55E"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#22C55E", stroke: "#18181B", strokeWidth: 2 }}
        />

        <Line
          type="monotone"
          dataKey="spend"
          stroke="#3B82F6"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          activeDot={{ r: 4, fill: "#3B82F6", stroke: "#18181B", strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
