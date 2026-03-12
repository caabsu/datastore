"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface FunnelDataPoint {
  stage: string;
  value: number;
  rate: number;
}

interface FunnelChartProps {
  data: FunnelDataPoint[];
}

function interpolateColor(t: number): string {
  // Interpolate from blue (#3B82F6) to green (#22C55E)
  const r = Math.round(0x3b + (0x22 - 0x3b) * t);
  const g = Math.round(0x82 + (0xc5 - 0x82) * t);
  const b = Math.round(0xf6 + (0x5e - 0xf6) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <ResponsiveContainer width="100%" height={data.length * 52 + 16}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 100, bottom: 8, left: 8 }}
        barCategoryGap="24%"
      >
        <XAxis
          type="number"
          domain={[0, maxValue]}
          hide
        />

        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fill: "#71717A", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={100}
        />

        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive>
          {data.map((_, index) => {
            const t = data.length > 1 ? index / (data.length - 1) : 0;
            return <Cell key={`cell-${index}`} fill={interpolateColor(t)} />;
          })}
          <LabelList
            content={({ x, y, width, height, index }: {
              x?: number | string;
              y?: number | string;
              width?: number | string;
              height?: number | string;
              index?: number;
            }) => {
              if (index === undefined || index < 0 || index >= data.length) return null;
              const entry = data[index];
              const numX = Number(x ?? 0);
              const numY = Number(y ?? 0);
              const numW = Number(width ?? 0);
              const numH = Number(height ?? 0);

              return (
                <text
                  x={numX + numW + 8}
                  y={numY + numH / 2}
                  fill="#71717A"
                  fontSize={12}
                  dominantBaseline="central"
                >
                  {formatCount(entry.value)} ({entry.rate}%)
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
