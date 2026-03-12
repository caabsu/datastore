"use client";

import { useState } from "react";
import KPICard from "@/components/cards/KPICard";
import {
  metaKPIs,
  metaCampaigns,
  metaDailyTrend,
  metaCreativeBreakdown,
  metaAudienceBreakdown,
  metaFunnel,
} from "@/lib/mock-data";
import type { MetaAd, MetaAdSet } from "@/lib/mock-data";
import {
  formatCurrency,
  formatPercent,
  formatMultiplier,
  formatCompactCurrency,
} from "@/lib/format";
import clsx from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";
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

function FatigueIndicator({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-red-400"
      : score >= 40
        ? "text-amber-400"
        : "text-emerald-400";
  const bg =
    score >= 70
      ? "bg-red-400"
      : score >= 40
        ? "bg-amber-400"
        : "bg-emerald-400";
  return (
    <span className={clsx("flex items-center justify-end gap-1.5 text-xs font-mono", color)}>
      <span className="relative flex h-1.5 w-8 rounded-full bg-zinc-800 overflow-hidden">
        <span
          className={clsx("absolute inset-y-0 left-0 rounded-full", bg)}
          style={{ width: `${score}%` }}
        />
      </span>
      {score}
    </span>
  );
}

function AudienceTypeBadge({ type }: { type: MetaAdSet['audienceType'] }) {
  const styles: Record<string, string> = {
    Broad: "bg-blue-500/10 text-blue-400",
    Lookalike: "bg-purple-500/10 text-purple-400",
    Interest: "bg-amber-500/10 text-amber-400",
    Custom: "bg-emerald-500/10 text-emerald-400",
    Retargeting: "bg-orange-500/10 text-orange-400",
  };
  return (
    <span className={clsx("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider", styles[type] || "bg-zinc-500/10 text-zinc-400")}>
      {type}
    </span>
  );
}

export default function MetaOverviewPage() {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

  const toggleCampaign = (name: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        // Also collapse child ad sets
        metaCampaigns
          .find((c) => c.name === name)
          ?.adSets.forEach((s) => {
            setExpandedAdSets((p) => {
              const n = new Set(p);
              n.delete(`${name}::${s.name}`);
              return n;
            });
          });
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleAdSet = (campaignName: string, adSetName: string) => {
    const key = `${campaignName}::${adSetName}`;
    setExpandedAdSets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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

      {/* ── Campaign → Ad Set → Ad Hierarchy ── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">
            Campaign → Ad Set → Ad Breakdown
          </h3>
          <span className="text-[11px] text-zinc-600">
            Expand to drill into ad set and ad-level metrics
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                <th className="pl-3 pr-1 py-2.5 w-[24px]"></th>
                <th className="px-2 py-2.5">Name</th>
                <th className="px-2 py-2.5">Info</th>
                <th className="px-2 py-2.5 text-right">Spend</th>
                <th className="px-2 py-2.5 text-right">Revenue</th>
                <th className="px-2 py-2.5 text-right">ROAS</th>
                <th className="px-2 py-2.5 text-right">CM</th>
                <th className="px-2 py-2.5 text-right">CM %</th>
                <th className="px-2 py-2.5 text-right">CPA</th>
                <th className="px-2 py-2.5 text-right">Purch.</th>
                <th className="px-2 py-2.5 text-right">Reach CPM</th>
                <th className="px-2 py-2.5 text-right">Freq.</th>
                <th className="px-2 py-2.5 text-right">Hook</th>
                <th className="px-2 py-2.5 text-right">Fatigue</th>
              </tr>
            </thead>
            <tbody>
              {metaCampaigns.map((campaign) => {
                const isCampaignExpanded = expandedCampaigns.has(campaign.name);
                return (
                  <>
                    {/* ═══ CAMPAIGN ROW ═══ */}
                    <tr
                      key={`c-${campaign.name}`}
                      className="border-b border-border/50 cursor-pointer transition-colors hover:bg-white/[0.02] bg-zinc-900/20"
                      onClick={() => toggleCampaign(campaign.name)}
                    >
                      <td className="pl-3 pr-1 py-2.5 text-zinc-500">
                        {isCampaignExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {campaign.name}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {campaign.adSets.length} ad sets · {campaign.ads.length} ads
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">{campaign.type}</span>
                          {campaign.dailyBudget && (
                            <span className="text-[10px] text-zinc-600">
                              ${campaign.dailyBudget}/day
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-semibold">
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-semibold">
                        {formatCurrency(campaign.revenue)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-semibold">
                        {formatMultiplier(campaign.roas)}
                      </td>
                      <td className={clsx("px-2 py-2.5 text-right font-mono font-semibold", campaign.cm >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {formatCurrency(campaign.cm)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                        {campaign.cmPct.toFixed(1)}%
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {formatCurrency(campaign.cpa, 2)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {campaign.purchases}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {formatCurrency(campaign.reachCPM, 2)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-500">—</td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-500">—</td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-500">—</td>
                    </tr>

                    {/* ═══ AD SET ROWS ═══ */}
                    {isCampaignExpanded &&
                      campaign.adSets.map((adSet: MetaAdSet) => {
                        const adSetKey = `${campaign.name}::${adSet.name}`;
                        const isAdSetExpanded = expandedAdSets.has(adSetKey);
                        return (
                          <>
                            <tr
                              key={`s-${adSetKey}`}
                              className="border-b border-border/30 bg-zinc-900/40 cursor-pointer transition-colors hover:bg-white/[0.015]"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAdSet(campaign.name, adSet.name);
                              }}
                            >
                              <td className="pl-3 pr-1 py-2 text-zinc-600">
                                <div className="pl-3">
                                  {isAdSetExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2 pl-2">
                                  <span
                                    className={clsx(
                                      "inline-block h-2 w-2 rounded-sm flex-shrink-0",
                                      adSet.status === "Active" ? "bg-emerald-400" : adSet.status === "Learning" ? "bg-amber-400" : "bg-zinc-600"
                                    )}
                                  />
                                  <span className="font-medium text-zinc-200 text-xs">
                                    {adSet.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-600">
                                    {adSet.ads.length} ads
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1.5">
                                  <AudienceTypeBadge type={adSet.audienceType} />
                                  <span className="text-[10px] text-zinc-600 truncate max-w-[120px]" title={adSet.targeting}>
                                    {adSet.targeting}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs font-medium">
                                {formatCurrency(adSet.spend)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs font-medium">
                                {formatCurrency(adSet.revenue)}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span className={clsx("font-mono text-xs font-medium", adSet.roas >= 3.0 ? "text-emerald-400" : adSet.roas >= 2.0 ? "text-zinc-300" : "text-red-400")}>
                                  {formatMultiplier(adSet.roas)}
                                </span>
                                {adSet.roasTrend !== 0 && (
                                  <span className={clsx("ml-1 text-[9px]", adSet.roasTrend > 0 ? "text-emerald-500" : "text-red-500")}>
                                    {adSet.roasTrend > 0 ? "▲" : "▼"}{Math.abs(adSet.roasTrend)}%
                                  </span>
                                )}
                              </td>
                              <td className={clsx("px-2 py-2 text-right font-mono text-xs", adSet.cm >= 0 ? "text-emerald-400" : "text-red-400")}>
                                {adSet.cm < 0 ? "-" : ""}{formatCurrency(Math.abs(adSet.cm))}
                              </td>
                              <td className={clsx("px-2 py-2 text-right font-mono text-xs", adSet.cmPct >= 20 ? "text-emerald-400" : adSet.cmPct >= 0 ? "text-zinc-400" : "text-red-400")}>
                                {adSet.cmPct.toFixed(1)}%
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs">
                                {formatCurrency(adSet.cpa, 2)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs">
                                {adSet.purchases}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span className={clsx("font-mono text-xs", adSet.reachCPM <= 12 ? "text-emerald-400" : adSet.reachCPM <= 22 ? "text-zinc-300" : "text-red-400")}>
                                  ${adSet.reachCPM.toFixed(2)}
                                </span>
                                {adSet.reachCPMTrend !== 0 && (
                                  <span className={clsx("ml-1 text-[9px]", adSet.reachCPMTrend < 0 ? "text-emerald-500" : "text-red-500")}>
                                    {adSet.reachCPMTrend > 0 ? "▲" : "▼"}{Math.abs(adSet.reachCPMTrend)}%
                                  </span>
                                )}
                              </td>
                              <td className={clsx("px-2 py-2 text-right font-mono text-xs", adSet.frequency <= 1.5 ? "text-emerald-400" : adSet.frequency <= 2.5 ? "text-zinc-300" : "text-red-400")}>
                                {adSet.frequency.toFixed(1)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs text-zinc-500">—</td>
                              <td className="px-2 py-2 text-right font-mono text-xs text-zinc-500">—</td>
                            </tr>

                            {/* ═══ AD ROWS ═══ */}
                            {isAdSetExpanded &&
                              adSet.ads.map((ad: MetaAd) => (
                                <tr
                                  key={`a-${ad.id}`}
                                  className="border-b border-border/20 bg-zinc-950/40 transition-colors hover:bg-white/[0.01]"
                                >
                                  <td className="pl-3 pr-1 py-1.5"></td>
                                  <td className="px-2 py-1.5">
                                    <div className="flex items-center gap-2 pl-6">
                                      <span
                                        className={clsx(
                                          "inline-block h-1.5 w-1.5 rounded-full flex-shrink-0",
                                          ad.status === "Active" ? "bg-emerald-400" : "bg-zinc-600"
                                        )}
                                      />
                                      <span className="text-zinc-300 text-[11px]">
                                        {ad.adName}
                                      </span>
                                      {ad.status === "Paused" && (
                                        <span className="text-[9px] text-zinc-600 uppercase">paused</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={clsx(
                                          "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium",
                                          ad.creativeType === "Video"
                                            ? "bg-purple-500/10 text-purple-400"
                                            : ad.creativeType === "Carousel"
                                              ? "bg-blue-500/10 text-blue-400"
                                              : "bg-zinc-500/10 text-zinc-400"
                                        )}
                                      >
                                        {ad.creativeType}
                                      </span>
                                      <span className="text-[10px] text-zinc-600">
                                        {ad.daysActive}d
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.spend)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.revenue)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    <span className={clsx("font-mono text-[11px] font-medium", ad.roas >= 3.0 ? "text-emerald-400" : ad.roas >= 2.0 ? "text-zinc-300" : "text-red-400")}>
                                      {formatMultiplier(ad.roas)}
                                    </span>
                                    {ad.roasTrend !== 0 && (
                                      <span className={clsx("ml-1 text-[8px]", ad.roasTrend > 0 ? "text-emerald-500" : "text-red-500")}>
                                        {ad.roasTrend > 0 ? "▲" : "▼"}{Math.abs(ad.roasTrend)}%
                                      </span>
                                    )}
                                  </td>
                                  <td className={clsx("px-2 py-1.5 text-right font-mono text-[11px]", ad.contributionMargin >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {ad.contributionMargin < 0 ? "-" : ""}{formatCurrency(Math.abs(ad.contributionMargin))}
                                  </td>
                                  <td className={clsx("px-2 py-1.5 text-right font-mono text-[11px]", ad.cmPct >= 20 ? "text-emerald-400" : ad.cmPct >= 0 ? "text-zinc-400" : "text-red-400")}>
                                    {ad.cmPct.toFixed(1)}%
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.cpa, 2)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {ad.purchases}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    ${ad.reachCPM.toFixed(2)}
                                  </td>
                                  <td className={clsx("px-2 py-1.5 text-right font-mono text-[11px]", ad.frequency <= 1.5 ? "text-emerald-400" : ad.frequency <= 2.5 ? "text-zinc-300" : "text-red-400")}>
                                    {ad.frequency.toFixed(1)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {ad.hookRate !== null ? (
                                      <span className={clsx(ad.hookRate >= 30 ? "text-emerald-400" : ad.hookRate >= 20 ? "text-zinc-300" : "text-red-400")}>
                                        {ad.hookRate.toFixed(1)}%
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600">—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    <FatigueIndicator score={ad.fatigueScore} />
                                  </td>
                                </tr>
                              ))}
                          </>
                        );
                      })}
                  </>
                );
              })}

              {/* Account Total Row */}
              <tr className="border-t-2 border-border font-semibold bg-zinc-900/10">
                <td className="pl-3 pr-1 py-2.5"></td>
                <td className="px-2 py-2.5 text-foreground">Account Total</td>
                <td className="px-2 py-2.5 text-[10px] text-zinc-600">
                  {metaCampaigns.length} campaigns · {metaCampaigns.reduce((s, c) => s + c.adSets.length, 0)} ad sets · {metaCampaigns.reduce((s, c) => s + c.ads.length, 0)} ads
                </td>
                <td className="px-2 py-2.5 text-right font-mono">
                  {formatCurrency(accountTotals.spend)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono">
                  {formatCurrency(accountTotals.revenue)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono">
                  {formatMultiplier(accountTotals.roas)}
                </td>
                <td className={clsx("px-2 py-2.5 text-right font-mono", accountTotals.cm >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatCurrency(accountTotals.cm)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                  {accountTotals.revenue > 0 ? ((accountTotals.cm / accountTotals.revenue) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="px-2 py-2.5 text-right font-mono">
                  {formatCurrency(accountTotals.purchases > 0 ? accountTotals.spend / accountTotals.purchases : 0, 2)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono">
                  {accountTotals.purchases}
                </td>
                <td className="px-2 py-2.5 text-right font-mono text-muted" colSpan={4}>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-zinc-600 italic">
          All metrics are derived from the ad level and aggregated up. Hook Rate is only available for Video creatives.
          Fatigue score is based on frequency, reach CPM ratio, and days active. Reach CPM is cost per 1,000 unique users reached.
        </p>
      </div>
    </div>
  );
}
