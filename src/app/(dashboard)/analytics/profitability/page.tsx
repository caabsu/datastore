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
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import {
  profitabilityData,
  profitabilityTrend,
  channelEfficiency,
} from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/format";

/* ── Waterfall helpers ── */
interface WaterfallBar {
  name: string;
  value: number;
  base: number;
  fill: string;
  displayValue: number;
}

function formatDollar(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000)
    return `${value < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)
    return `${value < 0 ? "-" : ""}$${(abs / 1_000).toFixed(1)}K`;
  return `${value < 0 ? "-" : ""}$${abs}`;
}

function buildWaterfallBars(): WaterfallBar[] {
  const d = profitabilityData;
  const GREEN = "#22C55E";
  const RED = "#EF4444";
  const META_BLUE = "#1877F2";
  const GOOGLE_BLUE = "#4285F4";

  const items: {
    name: string;
    value: number;
    isTotal?: boolean;
    color?: string;
  }[] = [
    { name: "Gross Revenue", value: d.grossRevenue, isTotal: true },
    { name: "Refunds", value: -d.refunds, color: RED },
    { name: "Net Revenue", value: d.netRevenue, isTotal: true },
    { name: "COGS", value: -d.cogs, color: RED },
    { name: "Fulfillment", value: -d.fulfillment, color: RED },
    { name: "Processing", value: -d.processing, color: RED },
    { name: "Meta Spend", value: -d.metaSpend, color: META_BLUE },
    { name: "Google Spend", value: -d.googleSpend, color: GOOGLE_BLUE },
    { name: "Contribution Margin", value: d.contributionMargin, isTotal: true },
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
      const base =
        item.value < 0 ? runningTotal + item.value : runningTotal;
      bars.push({
        name: item.name,
        value: Math.abs(item.value),
        base,
        fill: item.color || (item.value >= 0 ? GREEN : RED),
        displayValue: item.value,
      });
      runningTotal += item.value;
    }
  }

  return bars;
}

/* ── P&L Breakdown rows ── */
interface PLRow {
  label: string;
  today: number;
  avg7d: number;
  avg28d: number;
  isSubtotal?: boolean;
  isCurrency?: boolean;
}

function buildPLRows(): PLRow[] {
  const d = profitabilityData;
  return [
    {
      label: "Gross Revenue",
      today: d.grossRevenue,
      avg7d: d.avg7d.grossRevenue,
      avg28d: d.avg28d.grossRevenue,
      isCurrency: true,
    },
    {
      label: "  Refunds",
      today: -d.refunds,
      avg7d: -d.avg7d.refunds,
      avg28d: -d.avg28d.refunds,
      isCurrency: true,
    },
    {
      label: "= Net Revenue",
      today: d.netRevenue,
      avg7d: d.avg7d.netRevenue,
      avg28d: d.avg28d.netRevenue,
      isSubtotal: true,
      isCurrency: true,
    },
    {
      label: "  COGS",
      today: -d.cogs,
      avg7d: -d.avg7d.cogs,
      avg28d: -d.avg28d.cogs,
      isCurrency: true,
    },
    {
      label: "  Fulfillment",
      today: -d.fulfillment,
      avg7d: -d.avg7d.fulfillment,
      avg28d: -d.avg28d.fulfillment,
      isCurrency: true,
    },
    {
      label: "  Processing",
      today: -d.processing,
      avg7d: -d.avg7d.processing,
      avg28d: -d.avg28d.processing,
      isCurrency: true,
    },
    {
      label: "= Gross Profit",
      today: d.grossProfit,
      avg7d: d.avg7d.grossProfit,
      avg28d: d.avg28d.grossProfit,
      isSubtotal: true,
      isCurrency: true,
    },
    {
      label: "  Meta Spend",
      today: -d.metaSpend,
      avg7d: -d.avg7d.metaSpend,
      avg28d: -d.avg28d.metaSpend,
      isCurrency: true,
    },
    {
      label: "  Google Spend",
      today: -d.googleSpend,
      avg7d: -d.avg7d.googleSpend,
      avg28d: -d.avg28d.googleSpend,
      isCurrency: true,
    },
    {
      label: "= Contribution Margin",
      today: d.contributionMargin,
      avg7d: d.avg7d.contributionMargin,
      avg28d: d.avg28d.contributionMargin,
      isSubtotal: true,
      isCurrency: true,
    },
    {
      label: "  CM %",
      today: d.cmPct,
      avg7d: d.avg7d.cmPct,
      avg28d: d.avg28d.cmPct,
    },
  ];
}

function deltaPercent(current: number, prior: number): string {
  if (prior === 0) return "--";
  const delta = ((current - prior) / Math.abs(prior)) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function deltaColor(current: number, prior: number, invert = false): string {
  if (prior === 0) return "text-muted";
  const delta = current - prior;
  const isPositive = invert ? delta < 0 : delta > 0;
  if (Math.abs(delta / Math.abs(prior)) < 0.01) return "text-muted";
  return isPositive ? "text-emerald-400" : "text-red-400";
}

export default function ProfitabilityPage() {
  const waterfallBars = buildWaterfallBars();
  const plRows = buildPLRows();

  const efficiencyTotal = channelEfficiency.reduce(
    (acc, ch) => ({
      spend: acc.spend + ch.spend,
      revenue: acc.revenue + ch.revenue,
      cm: acc.cm + ch.cm,
    }),
    { spend: 0, revenue: 0, cm: 0 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-100">
        Profitability &mdash; P&amp;L View
      </h1>

      {/* Contribution Margin Waterfall */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Contribution Margin Waterfall
        </h3>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={waterfallBars}
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
              height={80}
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
            {/* Invisible base */}
            <Bar
              dataKey="base"
              stackId="waterfall"
              fill="transparent"
              isAnimationActive={false}
            >
              {waterfallBars.map((_, i) => (
                <Cell key={`base-${i}`} fill="transparent" />
              ))}
            </Bar>
            {/* Visible bar */}
            <Bar dataKey="value" stackId="waterfall" radius={[3, 3, 0, 0]}>
              {waterfallBars.map((bar, i) => (
                <Cell key={`val-${i}`} fill={bar.fill} />
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
      </div>

      {/* P&L Breakdown Table */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          P&amp;L Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Line Item</th>
                <th className="pb-3 pr-4 text-right">Today</th>
                <th className="pb-3 pr-4 text-right">7d Avg</th>
                <th className="pb-3 pr-4 text-right">28d Avg</th>
                <th className="pb-3 text-right">&Delta;%</th>
              </tr>
            </thead>
            <tbody>
              {plRows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-border/50 transition-colors ${
                    row.isSubtotal
                      ? "bg-surface-hover font-semibold"
                      : "data-row"
                  }`}
                >
                  <td
                    className={`py-3 pr-4 whitespace-nowrap ${
                      row.isSubtotal ? "text-zinc-100" : "text-zinc-400"
                    }`}
                  >
                    {row.label}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {row.isCurrency
                      ? formatCurrency(row.today)
                      : formatPercent(row.today)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-muted">
                    {row.isCurrency
                      ? formatCurrency(row.avg7d)
                      : formatPercent(row.avg7d)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-muted">
                    {row.isCurrency
                      ? formatCurrency(row.avg28d)
                      : formatPercent(row.avg28d)}
                  </td>
                  <td
                    className={`py-3 text-right font-mono text-xs ${deltaColor(
                      row.today,
                      row.avg7d,
                      !row.isSubtotal && row.today < 0
                    )}`}
                  >
                    {deltaPercent(Math.abs(row.today), Math.abs(row.avg7d))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contribution Margin Trend */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Contribution Margin Trend &mdash; Last 28 Days
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={profitabilityTrend}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="cmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
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
              yAxisId="left"
              tickFormatter={formatDollar}
              tick={{ fill: "#71717A", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "#71717A", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={50}
              domain={[20, 40]}
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
              formatter={(value: any, name: any) => [
                name === "cm" ? formatDollar(Number(value)) : `${value}%`,
                name === "cm" ? "CM $" : "CM %",
              ]}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cm"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#cmGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#22C55E",
                stroke: "#18181B",
                strokeWidth: 2,
              }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cmPct"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3B82F6",
                stroke: "#18181B",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded bg-emerald-500" />
            CM $
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-blue-500" />
            CM %
          </span>
        </div>
      </div>

      {/* Channel Efficiency Comparison */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Channel Efficiency Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Channel</th>
                <th className="pb-3 pr-4 text-right">Spend</th>
                <th className="pb-3 pr-4 text-right">Revenue</th>
                <th className="pb-3 pr-4 text-right">ROAS</th>
                <th className="pb-3 pr-4 text-right">CPA</th>
                <th className="pb-3 pr-4 text-right">CM $</th>
                <th className="pb-3 text-right">CM %</th>
              </tr>
            </thead>
            <tbody>
              {channelEfficiency.map((ch) => (
                <tr
                  key={ch.channel}
                  className="data-row border-b border-border/50 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: ch.color }}
                      />
                      <span className="text-zinc-200">{ch.channel}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(ch.spend)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(ch.revenue)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {ch.roas !== null ? `${ch.roas.toFixed(2)}x` : "--"}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {ch.cpa > 0 ? formatCurrency(ch.cpa, 2) : "--"}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(ch.cm)}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {formatPercent(ch.cmPct)}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="border-t border-border bg-surface-hover font-semibold">
                <td className="py-3 pr-4 text-zinc-100">Total</td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatCurrency(efficiencyTotal.spend)}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatCurrency(efficiencyTotal.revenue)}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {efficiencyTotal.spend > 0
                    ? `${(efficiencyTotal.revenue / efficiencyTotal.spend).toFixed(2)}x`
                    : "--"}
                </td>
                <td className="py-3 pr-4 text-right font-mono">--</td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatCurrency(efficiencyTotal.cm)}
                </td>
                <td className="py-3 text-right font-mono">
                  {formatPercent(
                    (efficiencyTotal.cm / efficiencyTotal.revenue) * 100
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
