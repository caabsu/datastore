"use client";

import {
  AreaChart,
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  profitabilityData,
  profitabilityTrend,
  channelEfficiency,
} from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/format";
import clsx from "clsx";

/* ── Format helpers ── */
function formatDollar(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000)
    return `${value < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)
    return `${value < 0 ? "-" : ""}$${(abs / 1_000).toFixed(1)}K`;
  return `${value < 0 ? "-" : ""}$${abs}`;
}

/* ── Waterfall row data ── */
interface WaterfallRow {
  label: string;
  sublabel?: string;
  left: number; // percentage from left edge
  width: number; // bar width as percentage
  value: number; // signed dollar value
  color: string;
  type: "total" | "subtotal" | "deduction";
  section?: "start" | "end";
}

function buildWaterfallRows(): WaterfallRow[] {
  const d = profitabilityData;
  const max = d.grossRevenue;
  const pct = (v: number) => (v / max) * 100;
  const rows: WaterfallRow[] = [];
  let running: number;

  // ── Section 1: Revenue
  running = d.grossRevenue;
  rows.push({
    label: "Gross Revenue",
    left: 0,
    width: pct(d.grossRevenue),
    value: d.grossRevenue,
    color: "#22C55E",
    type: "total",
    section: "start",
  });
  running -= d.refunds;
  rows.push({
    label: "Refunds",
    sublabel: `${((d.refunds / d.grossRevenue) * 100).toFixed(1)}% of gross`,
    left: pct(running),
    width: pct(d.refunds),
    value: -d.refunds,
    color: "#EF4444",
    type: "deduction",
  });
  rows.push({
    label: "Net Revenue",
    left: 0,
    width: pct(d.netRevenue),
    value: d.netRevenue,
    color: "#22C55E",
    type: "subtotal",
    section: "end",
  });

  // ── Section 2: Cost of Goods & Ops
  running = d.netRevenue;
  running -= d.cogs;
  rows.push({
    label: "COGS",
    sublabel: `${d.cogsPct}% of net revenue`,
    left: pct(running),
    width: pct(d.cogs),
    value: -d.cogs,
    color: "#EF4444",
    type: "deduction",
    section: "start",
  });
  running -= d.fulfillment;
  rows.push({
    label: "Fulfillment",
    sublabel: `~$6.00/order avg`,
    left: pct(running),
    width: pct(d.fulfillment),
    value: -d.fulfillment,
    color: "#F87171",
    type: "deduction",
  });
  running -= d.processing;
  rows.push({
    label: "Processing",
    sublabel: `${((d.processing / d.netRevenue) * 100).toFixed(1)}% of net`,
    left: pct(running),
    width: pct(d.processing),
    value: -d.processing,
    color: "#FCA5A5",
    type: "deduction",
  });
  rows.push({
    label: "Gross Profit",
    left: 0,
    width: pct(d.grossProfit),
    value: d.grossProfit,
    color: "#22C55E",
    type: "subtotal",
    section: "end",
  });

  // ── Section 3: Ad Spend
  running = d.grossProfit;
  running -= d.metaSpend;
  rows.push({
    label: "Meta Ads",
    sublabel: `${((d.metaSpend / d.grossProfit) * 100).toFixed(0)}% of gross profit`,
    left: pct(running),
    width: pct(d.metaSpend),
    value: -d.metaSpend,
    color: "#1877F2",
    type: "deduction",
    section: "start",
  });
  running -= d.googleSpend;
  rows.push({
    label: "Google Ads",
    sublabel: `${((d.googleSpend / d.grossProfit) * 100).toFixed(0)}% of gross profit`,
    left: pct(running),
    width: pct(d.googleSpend),
    value: -d.googleSpend,
    color: "#4285F4",
    type: "deduction",
  });
  rows.push({
    label: "Contribution Margin",
    sublabel: `${d.cmPct}% margin`,
    left: 0,
    width: pct(d.contributionMargin),
    value: d.contributionMargin,
    color: "#22C55E",
    type: "total",
    section: "end",
  });

  return rows;
}

/* ── P&L rows ── */
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
    { label: "Gross Revenue", today: d.grossRevenue, avg7d: d.avg7d.grossRevenue, avg28d: d.avg28d.grossRevenue, isCurrency: true },
    { label: "  Refunds", today: -d.refunds, avg7d: -d.avg7d.refunds, avg28d: -d.avg28d.refunds, isCurrency: true },
    { label: "= Net Revenue", today: d.netRevenue, avg7d: d.avg7d.netRevenue, avg28d: d.avg28d.netRevenue, isSubtotal: true, isCurrency: true },
    { label: "  COGS", today: -d.cogs, avg7d: -d.avg7d.cogs, avg28d: -d.avg28d.cogs, isCurrency: true },
    { label: "  Fulfillment", today: -d.fulfillment, avg7d: -d.avg7d.fulfillment, avg28d: -d.avg28d.fulfillment, isCurrency: true },
    { label: "  Processing", today: -d.processing, avg7d: -d.avg7d.processing, avg28d: -d.avg28d.processing, isCurrency: true },
    { label: "= Gross Profit", today: d.grossProfit, avg7d: d.avg7d.grossProfit, avg28d: d.avg28d.grossProfit, isSubtotal: true, isCurrency: true },
    { label: "  Meta Spend", today: -d.metaSpend, avg7d: -d.avg7d.metaSpend, avg28d: -d.avg28d.metaSpend, isCurrency: true },
    { label: "  Google Spend", today: -d.googleSpend, avg7d: -d.avg7d.googleSpend, avg28d: -d.avg28d.googleSpend, isCurrency: true },
    { label: "= Contribution Margin", today: d.contributionMargin, avg7d: d.avg7d.contributionMargin, avg28d: d.avg28d.contributionMargin, isSubtotal: true, isCurrency: true },
    { label: "  CM %", today: d.cmPct, avg7d: d.avg7d.cmPct, avg28d: d.avg28d.cmPct },
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

/* ── Page ── */
export default function ProfitabilityPage() {
  const waterfallRows = buildWaterfallRows();
  const plRows = buildPLRows();
  const d = profitabilityData;

  const efficiencyTotal = channelEfficiency.reduce(
    (acc, ch) => ({ spend: acc.spend + ch.spend, revenue: acc.revenue + ch.revenue, cm: acc.cm + ch.cm }),
    { spend: 0, revenue: 0, cm: 0 }
  );

  // Summary metrics for header
  const summarySteps = [
    { label: "Gross Revenue", value: d.grossRevenue, pct: 100 },
    { label: "Net Revenue", value: d.netRevenue, pct: +((d.netRevenue / d.grossRevenue) * 100).toFixed(1) },
    { label: "Gross Profit", value: d.grossProfit, pct: +((d.grossProfit / d.grossRevenue) * 100).toFixed(1) },
    { label: "Contribution Margin", value: d.contributionMargin, pct: d.cmPct },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Profitability &mdash; P&amp;L View
        </h1>
        <p className="text-xs text-muted mt-1">
          Full contribution margin breakdown with waterfall analysis
        </p>
      </div>

      {/* ── Summary Flow ── */}
      <div className="flex items-stretch gap-0">
        {summarySteps.map((step, i) => (
          <div key={step.label} className="flex items-stretch flex-1">
            <div
              className={clsx(
                "flex-1 rounded-lg border p-4 text-center",
                i === summarySteps.length - 1
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-border bg-surface"
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                {step.label}
              </p>
              <p
                className={clsx(
                  "text-xl font-mono font-semibold",
                  i === summarySteps.length - 1
                    ? "text-emerald-400"
                    : "text-foreground"
                )}
              >
                {formatCurrency(step.value)}
              </p>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                {step.pct}% of gross
              </p>
            </div>
            {i < summarySteps.length - 1 && (
              <div className="flex items-center px-2">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-zinc-600">
                  <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Horizontal Waterfall ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-5 text-sm font-medium text-zinc-400">
          Contribution Margin Waterfall
        </h3>

        <div className="space-y-0">
          {waterfallRows.map((row, i) => {
            const isTotal = row.type === "total" || row.type === "subtotal";
            const pctOfGross = (Math.abs(row.value) / d.grossRevenue) * 100;
            const showSectionDivider =
              row.section === "start" && i > 0;

            return (
              <div key={`${row.label}-${i}`}>
                {/* Section divider */}
                {showSectionDivider && (
                  <div className="my-2 border-t border-dashed border-zinc-800" />
                )}

                <div
                  className={clsx(
                    "grid items-center gap-3 py-1.5 rounded-md px-2 -mx-2",
                    isTotal && "bg-white/[0.015]"
                  )}
                  style={{
                    gridTemplateColumns: "160px 1fr 90px 60px",
                  }}
                >
                  {/* Label */}
                  <div>
                    <span
                      className={clsx(
                        "text-xs",
                        isTotal
                          ? "font-semibold text-zinc-200"
                          : "text-zinc-400 pl-3"
                      )}
                    >
                      {isTotal && row.type === "subtotal" ? "= " : ""}
                      {row.label}
                    </span>
                    {row.sublabel && (
                      <span className="block text-[10px] text-zinc-600 pl-3 mt-0.5">
                        {row.sublabel}
                      </span>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="relative h-6">
                    {/* Background track */}
                    <div className="absolute inset-0 rounded bg-zinc-800/30" />

                    {/* Connector line showing previous running total */}
                    {!isTotal && i > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-zinc-700/50"
                        style={{ left: `${row.left + row.width}%` }}
                      />
                    )}

                    {/* The bar itself */}
                    <div
                      className={clsx(
                        "absolute top-0 bottom-0 rounded transition-all",
                        isTotal ? "opacity-90" : "opacity-75"
                      )}
                      style={{
                        left: `${row.left}%`,
                        width: `${Math.max(row.width, 0.5)}%`,
                        backgroundColor: row.color,
                      }}
                    />

                    {/* Value label inside bar if wide enough */}
                    {row.width > 12 && (
                      <div
                        className="absolute top-0 bottom-0 flex items-center"
                        style={{
                          left: `${row.left + 1}%`,
                        }}
                      >
                        <span className="text-[10px] font-mono font-medium text-white/80 drop-shadow-sm pl-1">
                          {formatDollar(Math.abs(row.value))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dollar value */}
                  <div className="text-right">
                    <span
                      className={clsx(
                        "font-mono text-xs font-medium",
                        row.value >= 0 ? "text-emerald-400" : "text-red-400",
                        isTotal && "text-sm"
                      )}
                    >
                      {row.value < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>

                  {/* Percentage */}
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-zinc-500">
                      {row.value < 0 ? "-" : ""}
                      {pctOfGross.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale reference */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex justify-between text-[10px] font-mono text-zinc-600">
            <span>$0</span>
            <span>{formatDollar(d.grossRevenue / 4)}</span>
            <span>{formatDollar(d.grossRevenue / 2)}</span>
            <span>{formatDollar((d.grossRevenue * 3) / 4)}</span>
            <span>{formatDollar(d.grossRevenue)}</span>
          </div>
          <div className="relative h-px mt-1 bg-zinc-800">
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className="absolute top-0 w-px h-1.5 bg-zinc-700"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── P&L Breakdown Table ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          P&amp;L Breakdown — Period Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="pb-3 pr-4 font-medium">Line Item</th>
                <th className="pb-3 pr-4 text-right font-medium">Today</th>
                <th className="pb-3 pr-4 text-right font-medium">% of Gross</th>
                <th className="pb-3 pr-4 text-right font-medium">7d Avg</th>
                <th className="pb-3 pr-4 text-right font-medium">28d Avg</th>
                <th className="pb-3 text-right font-medium">vs 7d</th>
              </tr>
            </thead>
            <tbody>
              {plRows.map((row) => {
                const pctOfGross = row.isCurrency
                  ? ((Math.abs(row.today) / d.grossRevenue) * 100).toFixed(1)
                  : null;
                return (
                  <tr
                    key={row.label}
                    className={clsx(
                      "border-b border-border/50 transition-colors",
                      row.isSubtotal
                        ? "bg-white/[0.015] font-semibold"
                        : "data-row"
                    )}
                  >
                    <td
                      className={clsx(
                        "py-2.5 pr-4 whitespace-nowrap text-xs",
                        row.isSubtotal ? "text-zinc-100" : "text-zinc-400"
                      )}
                    >
                      {row.label}
                    </td>
                    <td
                      className={clsx(
                        "py-2.5 pr-4 text-right font-mono",
                        row.isSubtotal && row.today > 0 && "text-emerald-400"
                      )}
                    >
                      {row.isCurrency
                        ? formatCurrency(row.today)
                        : formatPercent(row.today)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-600 text-xs">
                      {pctOfGross !== null ? `${row.today < 0 ? "-" : ""}${pctOfGross}%` : ""}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-500 text-xs">
                      {row.isCurrency
                        ? formatCurrency(row.avg7d)
                        : formatPercent(row.avg7d)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-500 text-xs">
                      {row.isCurrency
                        ? formatCurrency(row.avg28d)
                        : formatPercent(row.avg28d)}
                    </td>
                    <td
                      className={clsx(
                        "py-2.5 text-right font-mono text-xs",
                        deltaColor(
                          row.today,
                          row.avg7d,
                          !row.isSubtotal && row.today < 0
                        )
                      )}
                    >
                      {deltaPercent(Math.abs(row.today), Math.abs(row.avg7d))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Contribution Margin Trend ── */}
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
            <CartesianGrid stroke="#1F1F23" strokeDasharray="none" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={{ stroke: "#1F1F23" }}
              tickLine={false}
              interval={6}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatDollar}
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
              domain={[20, 40]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181B",
                border: "1px solid #27272A",
                borderRadius: 8,
                color: "#F4F4F5",
                fontSize: 12,
              }}
              formatter={
                ((value: number, name: string) => [
                  name === "cm" ? formatDollar(value) : `${value}%`,
                  name === "cm" ? "CM $" : "CM %",
                ]) as never
              }
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cm"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#cmGradient)"
              dot={false}
              activeDot={{ r: 3, fill: "#22C55E", stroke: "#18181B", strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cmPct"
              stroke="#3B82F6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 3, fill: "#3B82F6", stroke: "#18181B", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-3 bg-emerald-500 rounded" />
            CM $ (left axis)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-[2px] w-3 rounded"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #3B82F6 0, #3B82F6 3px, transparent 3px, transparent 6px)",
              }}
            />
            CM % (right axis)
          </span>
        </div>
      </div>

      {/* ── Channel Efficiency Comparison ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Channel Efficiency Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="pb-3 pr-4 font-medium">Channel</th>
                <th className="pb-3 pr-4 text-right font-medium">Spend</th>
                <th className="pb-3 pr-4 text-right font-medium">Revenue</th>
                <th className="pb-3 pr-4 text-right font-medium">ROAS</th>
                <th className="pb-3 pr-4 text-right font-medium">CPA</th>
                <th className="pb-3 pr-4 text-right font-medium">CM $</th>
                <th className="pb-3 pr-4 text-right font-medium">CM %</th>
                <th className="pb-3 text-right font-medium">CM Share</th>
              </tr>
            </thead>
            <tbody>
              {channelEfficiency.map((ch) => {
                const cmShare =
                  efficiencyTotal.cm > 0
                    ? ((ch.cm / efficiencyTotal.cm) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr
                    key={ch.channel}
                    className="data-row border-b border-border/50 transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className="text-zinc-200 text-xs font-medium">
                          {ch.channel}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      {ch.spend > 0 ? formatCurrency(ch.spend) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      {formatCurrency(ch.revenue)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      {ch.roas !== null ? (
                        <span className={clsx(ch.roas >= 3.5 ? "text-emerald-400" : ch.roas >= 2.5 ? "text-zinc-300" : "text-amber-400")}>
                          {ch.roas.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-zinc-600">∞</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      {ch.cpa > 0 ? formatCurrency(ch.cpa, 2) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-emerald-400">
                      {formatCurrency(ch.cm)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      <span className={clsx(ch.cmPct >= 50 ? "text-emerald-400" : ch.cmPct >= 25 ? "text-zinc-300" : "text-amber-400")}>
                        {formatPercent(ch.cmPct)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cmShare}%`,
                              backgroundColor: ch.color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400 w-10 text-right">
                          {cmShare}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-2.5 pr-4 text-zinc-100 text-xs">Total</td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs">
                  {formatCurrency(efficiencyTotal.spend)}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs">
                  {formatCurrency(efficiencyTotal.revenue)}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs">
                  {efficiencyTotal.spend > 0
                    ? `${(efficiencyTotal.revenue / efficiencyTotal.spend).toFixed(2)}x`
                    : "—"}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs text-zinc-500">
                  —
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs text-emerald-400">
                  {formatCurrency(efficiencyTotal.cm)}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs">
                  {formatPercent((efficiencyTotal.cm / efficiencyTotal.revenue) * 100)}
                </td>
                <td className="py-2.5 text-right font-mono text-[11px] text-zinc-400">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
