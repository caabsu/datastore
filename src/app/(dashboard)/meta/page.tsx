"use client";

import KPICard from "@/components/cards/KPICard";
import {
  metaKPIs,
  metaCampaigns,
  metaDailyTrend,
  metaCreativeBreakdown,
  metaAudienceBreakdown,
  metaFunnel,
} from "@/lib/mock-data";
import {
  formatCurrency,
  formatPercent,
  formatMultiplier,
  formatCompactCurrency,
} from "@/lib/format";
import clsx from "clsx";
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

export default function MetaOverviewPage() {
  const accountTotals = {
    spend: metaCampaigns.reduce((s, c) => s + c.spend, 0),
    revenue: metaCampaigns.reduce((s, c) => s + c.revenue, 0),
    cm: metaCampaigns.reduce((s, c) => s + c.cm, 0),
    purchases: metaCampaigns.reduce((s, c) => s + c.purchases, 0),
    roas:
      metaCampaigns.reduce((s, c) => s + c.revenue, 0) /
      metaCampaigns.reduce((s, c) => s + c.spend, 0),
  };

  const funnelMax = metaFunnel[0].value;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Meta Ads Overview
        </h1>
        <p className="text-xs text-muted mt-1">
          Performance summary across all Meta campaigns — Last 7 days
        </p>
      </div>

      {/* ── KPI Cards Row 1 ── */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Spend"
          value={formatCurrency(metaKPIs.spend.value)}
          change={metaKPIs.spend.change}
          sparkline={metaKPIs.spend.sparkline}
        />
        <KPICard
          title="Revenue"
          value={formatCurrency(metaKPIs.revenue.value)}
          change={metaKPIs.revenue.change}
          sparkline={metaKPIs.revenue.sparkline}
        />
        <KPICard
          title="ROAS"
          value={formatMultiplier(metaKPIs.roas.value)}
          change={metaKPIs.roas.change}
          sparkline={metaKPIs.roas.sparkline}
        />
        <KPICard
          title="Purchases"
          value={metaKPIs.purchases.value.toString()}
          change={metaKPIs.purchases.change}
          sparkline={metaKPIs.purchases.sparkline}
        />
      </div>

      {/* ── KPI Cards Row 2 ── */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="CPA"
          value={formatCurrency(metaKPIs.cpa.value, 2)}
          change={metaKPIs.cpa.change}
          invertTrend
          sparkline={metaKPIs.cpa.sparkline}
        />
        <KPICard
          title="Incr. ROAS"
          value={formatMultiplier(metaKPIs.incrROAS.value)}
          change={metaKPIs.incrROAS.change}
          sparkline={metaKPIs.incrROAS.sparkline}
        />
        <KPICard
          title="Avg Hook Rate"
          value={formatPercent(metaKPIs.hookRate.value)}
          change={metaKPIs.hookRate.change}
          sparkline={metaKPIs.hookRate.sparkline}
        />
        <KPICard
          title="Avg Engagement Depth"
          value={metaKPIs.engagementDepth.value.toFixed(1)}
          change={metaKPIs.engagementDepth.change}
          sparkline={metaKPIs.engagementDepth.sparkline}
        />
      </div>

      {/* ── Spend & Revenue Trend (ComposedChart) ── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Spend & Revenue Trend — Last 28 Days
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={metaDailyTrend}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="metaRevenueGrad" x1="0" y1="0" x2="0" y2="1">
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
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={{ stroke: "#1F1F23" }}
              tickLine={false}
              interval={6}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `${v}x`}
              domain={["dataMin - 0.5", "dataMax + 0.3"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181B",
                border: "1px solid #27272A",
                borderRadius: 8,
                color: "#F4F4F5",
                fontSize: 12,
              }}
              labelStyle={{ color: "#71717A", marginBottom: 4 }}
              formatter={
                ((value: number, name: string) => {
                  if (name === "revenue")
                    return [formatCompactCurrency(value), "Revenue"];
                  if (name === "spend")
                    return [formatCompactCurrency(value), "Spend"];
                  if (name === "roas") return [`${value}x`, "ROAS"];
                  return [value, name];
                }) as never
              }
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#metaRevenueGrad)"
              dot={false}
              activeDot={{
                r: 3,
                fill: "#22C55E",
                stroke: "#18181B",
                strokeWidth: 2,
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="spend"
              stroke="#1877F2"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 3,
                fill: "#1877F2",
                stroke: "#18181B",
                strokeWidth: 2,
              }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roas"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{
                r: 3,
                fill: "#F59E0B",
                stroke: "#18181B",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-3 bg-emerald-500 rounded" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-3 bg-[#1877F2] rounded" />
            Spend
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-[2px] w-3 rounded"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #F59E0B 0, #F59E0B 3px, transparent 3px, transparent 6px)",
              }}
            />
            ROAS (right axis)
          </span>
        </div>
      </div>

      {/* ── Creative Type Performance + Audience Performance ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Creative Type Performance */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Creative Type Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2 text-right">Ads</th>
                  <th className="px-2 py-2 text-right">Spend</th>
                  <th className="px-2 py-2 text-right">Revenue</th>
                  <th className="px-2 py-2 text-right">ROAS</th>
                  <th className="px-2 py-2 text-right">Purch.</th>
                  <th className="px-2 py-2 text-right">CPA</th>
                  <th className="px-2 py-2 text-right">CM</th>
                </tr>
              </thead>
              <tbody>
                {metaCreativeBreakdown.map((row) => (
                  <tr
                    key={row.type}
                    className="border-b border-border/50 data-row transition-colors"
                  >
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-medium text-zinc-200">
                          {row.type}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                      {row.count}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {formatCurrency(row.spend)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono font-medium">
                      {formatMultiplier(row.roas)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {row.purchases}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {formatCurrency(row.cpa, 2)}
                    </td>
                    <td
                      className={clsx(
                        "px-2 py-2.5 text-right font-mono",
                        row.cm >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {formatCurrency(row.cm)}
                    </td>
                  </tr>
                ))}
                {/* Totals */}
                <tr className="border-t-2 border-border font-semibold">
                  <td className="px-2 py-2.5 text-foreground">Total</td>
                  <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                    {metaCreativeBreakdown.reduce((s, r) => s + r.count, 0)}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      metaCreativeBreakdown.reduce((s, r) => s + r.spend, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      metaCreativeBreakdown.reduce((s, r) => s + r.revenue, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono font-medium">
                    {formatMultiplier(
                      metaCreativeBreakdown.reduce((s, r) => s + r.revenue, 0) /
                        metaCreativeBreakdown.reduce((s, r) => s + r.spend, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {metaCreativeBreakdown.reduce(
                      (s, r) => s + r.purchases,
                      0
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      metaCreativeBreakdown.reduce((s, r) => s + r.spend, 0) /
                        metaCreativeBreakdown.reduce(
                          (s, r) => s + r.purchases,
                          0
                        ),
                      2
                    )}
                  </td>
                  <td
                    className={clsx(
                      "px-2 py-2.5 text-right font-mono",
                      metaCreativeBreakdown.reduce((s, r) => s + r.cm, 0) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    )}
                  >
                    {formatCurrency(
                      metaCreativeBreakdown.reduce((s, r) => s + r.cm, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audience Performance */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Audience Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-2 py-2">Audience</th>
                  <th className="px-2 py-2 text-right">Spend</th>
                  <th className="px-2 py-2 text-right">Revenue</th>
                  <th className="px-2 py-2 text-right">ROAS</th>
                  <th className="px-2 py-2 text-right">Purch.</th>
                  <th className="px-2 py-2 text-right">Reach CPM</th>
                  <th className="px-2 py-2 text-right">Incr. %</th>
                </tr>
              </thead>
              <tbody>
                {metaAudienceBreakdown.map((row) => (
                  <tr
                    key={row.audience}
                    className="border-b border-border/50 data-row transition-colors"
                  >
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-medium text-zinc-200 text-xs">
                          {row.audience}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {formatCurrency(row.spend)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono font-medium">
                      {formatMultiplier(row.roas)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {row.purchases}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {formatCurrency(row.reachCPM, 2)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      {row.incrReach !== null ? (
                        formatPercent(row.incrReach)
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Totals */}
                <tr className="border-t-2 border-border font-semibold">
                  <td className="px-2 py-2.5 text-foreground">Total</td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      metaAudienceBreakdown.reduce((s, r) => s + r.spend, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      metaAudienceBreakdown.reduce((s, r) => s + r.revenue, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono font-medium">
                    {formatMultiplier(
                      metaAudienceBreakdown.reduce((s, r) => s + r.revenue, 0) /
                        metaAudienceBreakdown.reduce((s, r) => s + r.spend, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {metaAudienceBreakdown.reduce(
                      (s, r) => s + r.purchases,
                      0
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-zinc-500">
                    —
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-zinc-500">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Conversion Funnel ── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Conversion Funnel — Account Aggregated
        </h3>
        <div className="space-y-2.5">
          {metaFunnel.map((stage, i) => {
            const barWidth = (stage.value / funnelMax) * 100;
            return (
              <div key={stage.stage} className="flex items-center gap-3">
                <div className="w-[100px] flex-shrink-0 text-right">
                  <span className="text-xs text-zinc-400">{stage.stage}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-7 rounded bg-zinc-800/40 overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor:
                          i === 0
                            ? "#1877F2"
                            : `rgba(24, 119, 242, ${1 - i * 0.14})`,
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-mono font-medium text-white drop-shadow-sm">
                      {stage.value >= 1000
                        ? `${(stage.value / 1000).toFixed(stage.value >= 10000 ? 0 : 1)}k`
                        : stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-[60px] flex-shrink-0 text-right">
                  {stage.rate !== null ? (
                    <span className="text-xs font-mono text-zinc-400">
                      {formatPercent(stage.rate)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-zinc-600 italic">
          Rates shown are stage-to-stage conversion rates.
        </p>
      </div>

      {/* ── Campaign Summary Table ── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Campaign Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Campaign</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Spend</th>
                <th className="px-3 py-2.5 text-right">Revenue</th>
                <th className="px-3 py-2.5 w-[100px]"></th>
                <th className="px-3 py-2.5 text-right">Reach CPM</th>
                <th className="px-3 py-2.5 text-right">Incr. Reach %</th>
                <th className="px-3 py-2.5 text-right">Incr. ROAS</th>
                <th className="px-3 py-2.5 text-right">CM</th>
                <th className="px-3 py-2.5 text-right">ROAS</th>
                <th className="px-3 py-2.5 text-right">Purchases</th>
              </tr>
            </thead>
            <tbody>
              {metaCampaigns.map((campaign) => {
                const revenueBarWidth =
                  (campaign.revenue / accountTotals.revenue) * 100;
                return (
                  <tr
                    key={campaign.name}
                    className="border-b border-border/50 data-row transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {campaign.name}
                    </td>
                    <td className="px-3 py-2.5 text-muted">{campaign.type}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium">
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-[6px] rounded-full bg-zinc-800/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${revenueBarWidth}%`,
                            backgroundColor: "#1877F2",
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {formatCurrency(campaign.reachCPM, 2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {campaign.incrReachPct !== null ? (
                        formatPercent(campaign.incrReachPct)
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {campaign.incrROAS !== null ? (
                        formatMultiplier(campaign.incrROAS)
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td
                      className={clsx(
                        "px-3 py-2.5 text-right font-mono",
                        campaign.cm >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {formatCurrency(campaign.cm)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium">
                      {formatMultiplier(campaign.roas)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {campaign.purchases}
                    </td>
                  </tr>
                );
              })}

              {/* Account Total Row */}
              <tr className="border-t-2 border-border bg-surface-hover font-semibold">
                <td className="px-3 py-2.5 text-foreground">Account Total</td>
                <td className="px-3 py-2.5 text-muted">—</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatCurrency(accountTotals.spend)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatCurrency(accountTotals.revenue)}
                </td>
                <td></td>
                <td className="px-3 py-2.5 text-right font-mono text-muted">
                  —
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted">
                  —
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted">
                  —
                </td>
                <td
                  className={clsx(
                    "px-3 py-2.5 text-right font-mono",
                    accountTotals.cm >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}
                >
                  {formatCurrency(accountTotals.cm)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMultiplier(accountTotals.roas)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {accountTotals.purchases}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-600 italic">
          Incr. ROAS and Incr. Reach % are blank for retargeting campaigns because
          incrementality measurement is only applicable to prospecting audiences
          reaching net-new users.
        </p>
      </div>
    </div>
  );
}
