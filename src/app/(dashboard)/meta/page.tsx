"use client";

import { useState, useEffect, useCallback } from "react";
import KPICard from "@/components/cards/KPICard";
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

/* ── Types for API responses ── */

interface AccountKPIs {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  purchases: number;
  revenue: number;
  roas: number;
  cpa: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reachCPM: number;
  hookRate: number;
  engagementDepth: number;
}

interface DailyTrendPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  impressions: number;
  reach: number;
  hookRate: number;
  engagementDepth: number;
}

interface FunnelStage {
  stage: string;
  value: number;
  rate: number | null;
}

interface CreativeBreakdownRow {
  type: string;
  count: number;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  cpa: number;
  cm: number;
  color: string;
}

interface AudienceBreakdownRow {
  audience: string;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  reachCPM: number;
  color: string;
}

interface APICampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  buyingType: string;
  dailyBudget: number | null;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  cpa: number;
  reachCPM: number;
  frequency: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface APIAdSet {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  optimizationGoal: string;
  targeting: Record<string, unknown> | null;
  dailyBudget: number | null;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  cpa: number;
  reachCPM: number;
  frequency: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface APIAd {
  id: string;
  name: string;
  adsetId: string;
  campaignId: string;
  status: string;
  creative: Record<string, unknown> | null;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  cpa: number;
  reachCPM: number;
  frequency: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

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

function AudienceTypeBadge({ type }: { type: string }) {
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

const META_TOOLTIPS: Record<string, string> = {
  spend:
    "Total amount spent on Meta Ads in the selected period. Includes all campaign types (Conversions, CBO, ASC). Sourced from Meta Ads Manager reporting API.",
  revenue:
    "Total purchase revenue attributed to Meta Ads via the Meta Pixel and Conversions API. Uses a 7-day click / 1-day view attribution window by default.",
  roas:
    "Return on Ad Spend. Revenue attributed to Meta divided by Meta ad spend. Formula: Meta Revenue / Meta Spend. Does not account for COGS or other costs — use CM for true profitability.",
  purchases:
    "Total purchase conversion events attributed to Meta Ads. A single click can generate multiple purchases if the customer returns within the attribution window.",
  cpa:
    "Cost Per Acquisition. Average cost to generate one purchase. Formula: Meta Spend / Purchases. Lower is better — trend is inverted so a decrease shows green.",
  incrROAS:
    "Incrementality-adjusted ROAS. Estimates the revenue that would NOT have occurred without the ad. Calculated using holdout test data or modeled lift. More conservative than standard ROAS.",
  hookRate:
    "Percentage of video viewers who watch at least 3 seconds. Formula: 3-Second Video Views / Impressions. Only applies to video creatives. Higher hook rates indicate stronger creative openings.",
  engagementDepth:
    "Composite score (1-10) measuring organic interaction quality: likes, comments, shares, saves relative to reach. Higher scores indicate content that drives meaningful engagement beyond passive viewing.",
};

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-5 w-48 bg-zinc-800 rounded" />
        <div className="h-3 w-72 bg-zinc-800/60 rounded mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 h-[130px]" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 h-[130px]" />
        ))}
      </div>
      <div className="bg-surface border border-border rounded-lg p-5 h-[380px]" />
    </div>
  );
}

export default function MetaOverviewPage() {
  /* ── Live data state ── */
  const [accountKPIs, setAccountKPIs] = useState<AccountKPIs | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendPoint[]>([]);
  const [campaigns, setCampaigns] = useState<APICampaign[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [creativeBreakdown, setCreativeBreakdown] = useState<CreativeBreakdownRow[]>([]);
  const [audienceBreakdown, setAudienceBreakdown] = useState<AudienceBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── On-demand hierarchy data ── */
  const [adSetsByCampaign, setAdSetsByCampaign] = useState<Record<string, APIAdSet[]>>({});
  const [adsByAdSet, setAdsByAdSet] = useState<Record<string, APIAd[]>>({});
  const [loadingAdSets, setLoadingAdSets] = useState<Set<string>>(new Set());
  const [loadingAds, setLoadingAds] = useState<Set<string>>(new Set());

  /* ── Expansion state ── */
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

  /* ── Fetch account-level data + campaigns on mount ── */
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [accountRes, campaignsRes, funnelRes, creativeRes, audienceRes] = await Promise.all([
          fetch("/api/meta?level=account"),
          fetch("/api/meta?level=campaigns"),
          fetch("/api/meta?level=funnel"),
          fetch("/api/meta?level=creative_breakdown"),
          fetch("/api/meta?level=audience_breakdown"),
        ]);

        if (!accountRes.ok) throw new Error(`Account API error: ${accountRes.status}`);
        if (!campaignsRes.ok) throw new Error(`Campaigns API error: ${campaignsRes.status}`);

        const accountData = await accountRes.json();
        const campaignsData = await campaignsRes.json();
        const funnelData = funnelRes.ok ? await funnelRes.json() : { funnel: [] };
        const creativeData = creativeRes.ok ? await creativeRes.json() : { creativeBreakdown: [] };
        const audienceData = audienceRes.ok ? await audienceRes.json() : { audienceBreakdown: [] };

        setAccountKPIs(accountData.kpis);
        setDailyTrend(accountData.dailyTrend ?? []);
        setCampaigns(campaignsData.campaigns ?? []);
        setFunnel(funnelData.funnel ?? []);
        setCreativeBreakdown(creativeData.creativeBreakdown ?? []);
        setAudienceBreakdown(audienceData.audienceBreakdown ?? []);
      } catch (err) {
        console.error("Failed to fetch Meta data:", err);
        setError(err instanceof Error ? err.message : "Failed to load Meta data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ── Fetch ad sets for a campaign ── */
  const fetchAdSets = useCallback(async (campaignId: string) => {
    if (adSetsByCampaign[campaignId] || loadingAdSets.has(campaignId)) return;
    setLoadingAdSets((prev) => new Set(prev).add(campaignId));
    try {
      const res = await fetch(`/api/meta?level=adsets&campaign_id=${campaignId}`);
      if (!res.ok) throw new Error(`Ad sets API error: ${res.status}`);
      const data = await res.json();
      setAdSetsByCampaign((prev) => ({ ...prev, [campaignId]: data.adSets ?? [] }));
    } catch (err) {
      console.error("Failed to fetch ad sets:", err);
    } finally {
      setLoadingAdSets((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    }
  }, [adSetsByCampaign, loadingAdSets]);

  /* ── Fetch ads for an ad set ── */
  const fetchAds = useCallback(async (adSetId: string) => {
    if (adsByAdSet[adSetId] || loadingAds.has(adSetId)) return;
    setLoadingAds((prev) => new Set(prev).add(adSetId));
    try {
      const res = await fetch(`/api/meta?level=ads&adset_id=${adSetId}`);
      if (!res.ok) throw new Error(`Ads API error: ${res.status}`);
      const data = await res.json();
      setAdsByAdSet((prev) => ({ ...prev, [adSetId]: data.ads ?? [] }));
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    } finally {
      setLoadingAds((prev) => {
        const next = new Set(prev);
        next.delete(adSetId);
        return next;
      });
    }
  }, [adsByAdSet, loadingAds]);

  /* ── Toggle campaign expansion (fetch ad sets on expand) ── */
  const toggleCampaign = useCallback((campaignId: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
        // Also collapse child ad sets
        const adSets = adSetsByCampaign[campaignId] ?? [];
        adSets.forEach((s) => {
          setExpandedAdSets((p) => {
            const n = new Set(p);
            n.delete(`${campaignId}::${s.id}`);
            return n;
          });
        });
      } else {
        next.add(campaignId);
        fetchAdSets(campaignId);
      }
      return next;
    });
  }, [adSetsByCampaign, fetchAdSets]);

  /* ── Toggle ad set expansion (fetch ads on expand) ── */
  const toggleAdSet = useCallback((campaignId: string, adSetId: string) => {
    const key = `${campaignId}::${adSetId}`;
    setExpandedAdSets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        fetchAds(adSetId);
      }
      return next;
    });
  }, [fetchAds]);

  /* ── Loading state ── */
  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Meta Ads Overview
          </h1>
          <p className="text-xs text-muted mt-1">
            Performance summary across all Meta campaigns — Last 7 days
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 text-sm text-red-400">
          <p className="font-medium">Failed to load Meta data</p>
          <p className="text-xs mt-1 text-red-400/70">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 text-xs font-medium rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Derive KPI card values ── */
  // Row 1: Spend, Revenue, ROAS, Purchases — all from live API
  // Row 2: CPA, Hook Rate, Engagement Depth — all from live API
  const spendValue = accountKPIs?.spend ?? 0;
  const revenueValue = accountKPIs?.revenue ?? 0;
  const roasValue = accountKPIs?.roas ?? 0;
  const purchasesValue = accountKPIs?.purchases ?? 0;
  const cpaValue = accountKPIs?.cpa ?? 0;
  const hookRateValue = accountKPIs?.hookRate ?? 0;
  const engagementDepthValue = accountKPIs?.engagementDepth ?? 0;

  // Build sparklines from dailyTrend for Row 1 KPIs
  const spendSparkline = dailyTrend.map((d) => d.spend);
  const revenueSparkline = dailyTrend.map((d) => d.revenue);
  const roasSparkline = dailyTrend.map((d) => d.roas);
  const purchasesSparkline = dailyTrend.map((d) => d.purchases);
  // CPA sparkline: spend / purchases per day
  const cpaSparkline = dailyTrend.map((d) =>
    d.purchases > 0 ? +(d.spend / d.purchases).toFixed(2) : 0
  );
  const hookRateSparkline = dailyTrend.map((d) => d.hookRate ?? 0);
  const engagementDepthSparkline = dailyTrend.map((d) => d.engagementDepth ?? 0);

  // Compute change % from sparklines (last 7 vs previous 7 from 28-day data)
  function computeChange(data: number[]): number {
    if (data.length < 14) return 0;
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const prevAvg = previous.reduce((s, v) => s + v, 0) / previous.length;
    if (prevAvg === 0) return 0;
    return +((recentAvg - prevAvg) / prevAvg * 100).toFixed(1);
  }

  const spendChange = computeChange(spendSparkline);
  const revenueChange = computeChange(revenueSparkline);
  const roasChange = computeChange(roasSparkline);
  const purchasesChange = computeChange(purchasesSparkline);
  const cpaChange = computeChange(cpaSparkline);
  const hookRateChange = computeChange(hookRateSparkline);
  const engagementDepthChange = computeChange(engagementDepthSparkline);

  /* ── Account totals from live campaign data ── */
  const accountTotals = {
    spend: campaigns.reduce((s, c) => s + (c.spend ?? 0), 0),
    revenue: campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0),
    purchases: campaigns.reduce((s, c) => s + (c.purchases ?? 0), 0),
    roas: 0,
  };
  accountTotals.roas =
    accountTotals.spend > 0 ? accountTotals.revenue / accountTotals.spend : 0;

  const funnelMax = funnel.length > 0 ? funnel[0].value : 1;

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
          value={formatCurrency(spendValue)}
          change={spendChange}
          sparkline={spendSparkline}
          tooltip={META_TOOLTIPS.spend}
        />
        <KPICard
          title="Revenue"
          value={formatCurrency(revenueValue)}
          change={revenueChange}
          sparkline={revenueSparkline}
          tooltip={META_TOOLTIPS.revenue}
        />
        <KPICard
          title="ROAS"
          value={formatMultiplier(roasValue)}
          change={roasChange}
          sparkline={roasSparkline}
          tooltip={META_TOOLTIPS.roas}
        />
        <KPICard
          title="Purchases"
          value={purchasesValue.toString()}
          change={purchasesChange}
          sparkline={purchasesSparkline}
          tooltip={META_TOOLTIPS.purchases}
        />
      </div>

      {/* ── KPI Cards Row 2 ── */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="CPA"
          value={formatCurrency(cpaValue, 2)}
          change={cpaChange}
          invertTrend
          sparkline={cpaSparkline}
          tooltip={META_TOOLTIPS.cpa}
        />
        <KPICard
          title="Avg Hook Rate"
          value={formatPercent(hookRateValue)}
          change={hookRateChange}
          sparkline={hookRateSparkline}
          tooltip={META_TOOLTIPS.hookRate}
        />
        <KPICard
          title="Avg Engagement Depth"
          value={engagementDepthValue.toFixed(1)}
          change={engagementDepthChange}
          sparkline={engagementDepthSparkline}
          tooltip={META_TOOLTIPS.engagementDepth}
        />
      </div>

      {/* ── Spend & Revenue Trend (ComposedChart) ── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Spend & Revenue Trend — Last 28 Days
        </h3>
        {dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={dailyTrend}
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
        ) : (
          <div className="flex items-center justify-center h-[320px] text-sm text-zinc-500">
            No trend data available
          </div>
        )}
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
          {creativeBreakdown.length > 0 ? (
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
                {creativeBreakdown.map((row) => (
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
                    {creativeBreakdown.reduce((s, r) => s + r.count, 0)}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      creativeBreakdown.reduce((s, r) => s + r.spend, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      creativeBreakdown.reduce((s, r) => s + r.revenue, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono font-medium">
                    {formatMultiplier(
                      creativeBreakdown.reduce((s, r) => s + r.spend, 0) > 0
                        ? creativeBreakdown.reduce((s, r) => s + r.revenue, 0) /
                            creativeBreakdown.reduce((s, r) => s + r.spend, 0)
                        : 0
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {creativeBreakdown.reduce(
                      (s, r) => s + r.purchases,
                      0
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      creativeBreakdown.reduce((s, r) => s + r.purchases, 0) > 0
                        ? creativeBreakdown.reduce((s, r) => s + r.spend, 0) /
                            creativeBreakdown.reduce((s, r) => s + r.purchases, 0)
                        : 0,
                      2
                    )}
                  </td>
                  <td
                    className={clsx(
                      "px-2 py-2.5 text-right font-mono",
                      creativeBreakdown.reduce((s, r) => s + r.cm, 0) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    )}
                  >
                    {formatCurrency(
                      creativeBreakdown.reduce((s, r) => s + r.cm, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-sm text-zinc-500">
              No creative breakdown data available
            </div>
          )}
        </div>

        {/* Audience Performance */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Audience Performance
          </h3>
          {audienceBreakdown.length > 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {audienceBreakdown.map((row) => (
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
                  </tr>
                ))}
                {/* Totals */}
                <tr className="border-t-2 border-border font-semibold">
                  <td className="px-2 py-2.5 text-foreground">Total</td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      audienceBreakdown.reduce((s, r) => s + r.spend, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {formatCurrency(
                      audienceBreakdown.reduce((s, r) => s + r.revenue, 0)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono font-medium">
                    {formatMultiplier(
                      audienceBreakdown.reduce((s, r) => s + r.spend, 0) > 0
                        ? audienceBreakdown.reduce((s, r) => s + r.revenue, 0) /
                            audienceBreakdown.reduce((s, r) => s + r.spend, 0)
                        : 0
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono">
                    {audienceBreakdown.reduce(
                      (s, r) => s + r.purchases,
                      0
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-zinc-500">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-sm text-zinc-500">
              No audience breakdown data available
            </div>
          )}
        </div>
      </div>

      {/* ── Conversion Funnel ── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Conversion Funnel — Account Aggregated
        </h3>
        {funnel.length > 0 ? (
        <div className="space-y-2.5">
          {funnel.map((stage, i) => {
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
        ) : (
          <div className="flex items-center justify-center h-[120px] text-sm text-zinc-500">
            No funnel data available
          </div>
        )}
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
                <th className="px-2 py-2.5 text-right">CPA</th>
                <th className="px-2 py-2.5 text-right">Purch.</th>
                <th className="px-2 py-2.5 text-right">Reach CPM</th>
                <th className="px-2 py-2.5 text-right">Freq.</th>
                <th className="px-2 py-2.5 text-right">CTR</th>
                <th className="px-2 py-2.5 text-right">CPC</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const isCampaignExpanded = expandedCampaigns.has(campaign.id);
                const campaignAdSets = adSetsByCampaign[campaign.id] ?? [];
                const isLoadingAdSets = loadingAdSets.has(campaign.id);
                return (
                  <>
                    {/* === CAMPAIGN ROW === */}
                    <tr
                      key={`c-${campaign.id}`}
                      className="border-b border-border/50 cursor-pointer transition-colors hover:bg-white/[0.02] bg-zinc-900/20"
                      onClick={() => toggleCampaign(campaign.id)}
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
                          <span
                            className={clsx(
                              "text-[10px] px-1.5 py-0.5 rounded",
                              campaign.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-500/10 text-zinc-500"
                            )}
                          >
                            {campaign.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">{campaign.buyingType ?? ""}</span>
                          {campaign.dailyBudget != null && (
                            <span className="text-[10px] text-zinc-600">
                              ${campaign.dailyBudget}/day
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-semibold">
                        {formatCurrency(campaign.spend ?? 0)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-semibold">
                        {formatCurrency(campaign.revenue ?? 0)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-semibold">
                        {formatMultiplier(campaign.roas ?? 0)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {formatCurrency(campaign.cpa ?? 0, 2)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {campaign.purchases ?? 0}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {formatCurrency(campaign.reachCPM ?? 0, 2)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                        {(campaign.frequency ?? 0).toFixed(1)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                        {(campaign.ctr ?? 0).toFixed(2)}%
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-zinc-400">
                        {formatCurrency(campaign.cpc ?? 0, 2)}
                      </td>
                    </tr>

                    {/* === AD SET ROWS === */}
                    {isCampaignExpanded && isLoadingAdSets && (
                      <tr key={`loading-${campaign.id}`} className="border-b border-border/30 bg-zinc-900/40">
                        <td colSpan={12} className="px-6 py-3 text-xs text-zinc-500 animate-pulse">
                          Loading ad sets...
                        </td>
                      </tr>
                    )}
                    {isCampaignExpanded &&
                      !isLoadingAdSets &&
                      campaignAdSets.map((adSet) => {
                        const adSetKey = `${campaign.id}::${adSet.id}`;
                        const isAdSetExpanded = expandedAdSets.has(adSetKey);
                        const adSetAds = adsByAdSet[adSet.id] ?? [];
                        const isLoadingTheseAds = loadingAds.has(adSet.id);
                        // Derive targeting label from API targeting object
                        const targetingLabel =
                          adSet.targeting && typeof adSet.targeting === "object"
                            ? JSON.stringify(adSet.targeting).slice(0, 40)
                            : "";
                        return (
                          <>
                            <tr
                              key={`s-${adSetKey}`}
                              className="border-b border-border/30 bg-zinc-900/40 cursor-pointer transition-colors hover:bg-white/[0.015]"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAdSet(campaign.id, adSet.id);
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
                                      adSet.status === "ACTIVE" ? "bg-emerald-400" : "bg-zinc-600"
                                    )}
                                  />
                                  <span className="font-medium text-zinc-200 text-xs">
                                    {adSet.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-zinc-500">{adSet.optimizationGoal ?? ""}</span>
                                  {targetingLabel && (
                                    <span className="text-[10px] text-zinc-600 truncate max-w-[120px]" title={targetingLabel}>
                                      {targetingLabel}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs font-medium">
                                {formatCurrency(adSet.spend ?? 0)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs font-medium">
                                {formatCurrency(adSet.revenue ?? 0)}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span className={clsx("font-mono text-xs font-medium", (adSet.roas ?? 0) >= 3.0 ? "text-emerald-400" : (adSet.roas ?? 0) >= 2.0 ? "text-zinc-300" : "text-red-400")}>
                                  {formatMultiplier(adSet.roas ?? 0)}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs">
                                {formatCurrency(adSet.cpa ?? 0, 2)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs">
                                {adSet.purchases ?? 0}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs">
                                {formatCurrency(adSet.reachCPM ?? 0, 2)}
                              </td>
                              <td className={clsx("px-2 py-2 text-right font-mono text-xs", (adSet.frequency ?? 0) <= 1.5 ? "text-emerald-400" : (adSet.frequency ?? 0) <= 2.5 ? "text-zinc-300" : "text-red-400")}>
                                {(adSet.frequency ?? 0).toFixed(1)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs text-zinc-400">
                                {(adSet.ctr ?? 0).toFixed(2)}%
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs text-zinc-400">
                                {formatCurrency(adSet.cpc ?? 0, 2)}
                              </td>
                            </tr>

                            {/* === AD ROWS === */}
                            {isAdSetExpanded && isLoadingTheseAds && (
                              <tr key={`loading-ads-${adSet.id}`} className="border-b border-border/20 bg-zinc-950/40">
                                <td colSpan={12} className="px-10 py-2.5 text-xs text-zinc-500 animate-pulse">
                                  Loading ads...
                                </td>
                              </tr>
                            )}
                            {isAdSetExpanded &&
                              !isLoadingTheseAds &&
                              adSetAds.map((ad) => (
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
                                          ad.status === "ACTIVE" ? "bg-emerald-400" : "bg-zinc-600"
                                        )}
                                      />
                                      <span className="text-zinc-300 text-[11px]">
                                        {ad.name}
                                      </span>
                                      {ad.status !== "ACTIVE" && (
                                        <span className="text-[9px] text-zinc-600 uppercase">{ad.status?.toLowerCase()}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <span className="text-[10px] text-zinc-600">
                                      ID: {ad.id}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.spend ?? 0)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.revenue ?? 0)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    <span className={clsx("font-mono text-[11px] font-medium", (ad.roas ?? 0) >= 3.0 ? "text-emerald-400" : (ad.roas ?? 0) >= 2.0 ? "text-zinc-300" : "text-red-400")}>
                                      {formatMultiplier(ad.roas ?? 0)}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.cpa ?? 0, 2)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {ad.purchases ?? 0}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                                    {formatCurrency(ad.reachCPM ?? 0, 2)}
                                  </td>
                                  <td className={clsx("px-2 py-1.5 text-right font-mono text-[11px]", (ad.frequency ?? 0) <= 1.5 ? "text-emerald-400" : (ad.frequency ?? 0) <= 2.5 ? "text-zinc-300" : "text-red-400")}>
                                    {(ad.frequency ?? 0).toFixed(1)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-zinc-400">
                                    {(ad.ctr ?? 0).toFixed(2)}%
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-zinc-400">
                                    {formatCurrency(ad.cpc ?? 0, 2)}
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
                  {campaigns.length} campaigns
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
