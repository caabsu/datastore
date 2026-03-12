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

interface ProfitWaterfallData {
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  cogs: number;
  fulfillment: number;
  processing: number;
  metaSpend: number;
  googleSpend: number;
  contributionMargin: number;
}

interface ProfitWaterfallProps {
  data: ProfitWaterfallData;
}

interface WaterfallBar {
  name: string;
  value: number;
  base: number;
  fill: string;
  displayValue: number;
}

function formatDollar(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${value < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${value < 0 ? "-" : ""}$${(abs / 1_000).toFixed(0)}K`;
  return `${value < 0 ? "-" : ""}$${abs}`;
}

function buildWaterfallBars(data: ProfitWaterfallData): WaterfallBar[] {
  const GREEN = "#22C55E";
  const RED = "#EF4444";

  const items: { name: string; value: number; isTotal?: boolean }[] = [
    { name: "Gross Revenue", value: data.grossRevenue, isTotal: true },
    { name: "Refunds", value: -Math.abs(data.refunds) },
    { name: "Net Revenue", value: data.netRevenue, isTotal: true },
    { name: "COGS", value: -Math.abs(data.cogs) },
    { name: "Fulfillment", value: -Math.abs(data.fulfillment) },
    { name: "Processing", value: -Math.abs(data.processing) },
    { name: "Meta Spend", value: -Math.abs(data.metaSpend) },
    { name: "Google Spend", value: -Math.abs(data.googleSpend) },
    { name: "Contribution", value: data.contributionMargin, isTotal: true },
  ];

  const bars: WaterfallBar[] = [];
  let runningTotal = 0;

  for (const item of items) {
    if (item.isTotal) {
      bars.push({
        name: item.name,
        value: item.value,
        base: 0,
        fill: item.value >= 0 ? GREEN : RED,
        displayValue: item.value,
      });
      runningTotal = item.value;
    } else {
      const base = item.value < 0 ? runningTotal + item.value : runningTotal;
      bars.push({
        name: item.name,
        value: Math.abs(item.value),
        base,
        fill: item.value >= 0 ? GREEN : RED,
        displayValue: item.value,
      });
      runningTotal += item.value;
    }
  }

  return bars;
}

export default function ProfitWaterfall({ data }: ProfitWaterfallProps) {
  const bars = buildWaterfallBars(data);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={bars}
        margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid
          stroke="#1F1F23"
          strokeDasharray="none"
          vertical={false}
        />

        <XAxis
          dataKey="name"
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={{ stroke: "#1F1F23" }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(_: any, __: any, props: any) => {
            const p = props?.payload as WaterfallBar | undefined;
            return p ? [formatDollar(p.displayValue), p.name] : ["", ""];
          }}
          labelFormatter={() => ""}
        />

        {/* Invisible base bar */}
        <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false}>
          {bars.map((_, index) => (
            <Cell key={`base-${index}`} fill="transparent" />
          ))}
        </Bar>

        {/* Visible value bar */}
        <Bar dataKey="value" stackId="waterfall" radius={[3, 3, 0, 0]}>
          {bars.map((bar, index) => (
            <Cell key={`val-${index}`} fill={bar.fill} />
          ))}
          <LabelList
            dataKey="displayValue"
            position="top"
            formatter={(v: unknown) => formatDollar(Number(v))}
            style={{ fill: "#71717A", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
