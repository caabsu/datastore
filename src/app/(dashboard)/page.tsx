"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import KPICard from "@/components/cards/KPICard";
import RevenueChart from "@/components/charts/RevenueChart";
import { formatCurrency, formatPercent, formatMultiplier } from "@/lib/format";
import clsx from "clsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";

const METRIC_TOOLTIPS: Record<string, string> = {
  netRevenue:
    "Total revenue after refunds and returns. Excludes tax and shipping unless configured in Settings. Formula: Gross Revenue - Refunds.",
  adSpend:
    "Total advertising spend across all paid channels (Meta Ads + Google Ads). Does not include organic, email, or influencer costs.",
  blendedROAS:
    "Marketing Efficiency Ratio (MER). Total revenue divided by total ad spend across all channels. Unlike channel-level ROAS, this captures the full business picture including organic lift from paid awareness. Formula: Net Revenue / Total Ad Spend.",
  contributionMargin:
    "Revenue remaining after all variable costs: COGS, fulfillment, payment processing, and ad spend. This is the true profit from operations before fixed costs. Formula: Net Revenue - COGS - Fulfillment - Processing - Ad Spend. The percentage shows CM as a share of Net Revenue.",
  orders:
    "Total completed orders in the selected period. Excludes cancelled and fully refunded orders. Sourced from Shopify order data.",
  aov:
    "Average Order Value. Revenue generated per order. Formula: Net Revenue / Total Orders. A higher AOV means more revenue per transaction — often driven by bundling, upsells, or price increases.",
  newCustomerCAC:
    "Customer Acquisition Cost for first-time buyers. Total ad spend allocated to new customers divided by the number of new customers acquired. Formula: (Ad Spend x New Customer %) / New Customers. Lower is better — trend is inverted so a decrease shows green.",
  newCustomerPct:
    "Percentage of total orders placed by first-time buyers. Formula: New Customer Orders / Total Orders. Indicates the balance between acquisition (new) and retention (returning). A healthy DTC brand typically targets 35-50%.",
};

// ── Types for API responses ──

interface ShopifyKPI {
  value: number;
  change: number;
}

interface ShopifyData {
  kpis: {
    netRevenue: ShopifyKPI;
    orders: ShopifyKPI;
    aov: ShopifyKPI;
    unitsPerOrder: ShopifyKPI;
    refundRate: ShopifyKPI;
    newCustomerPct: ShopifyKPI;
  };
  dailyRevenue: { date: string; total: number }[];
  dailyOrders: { date: string; newOrders: number; repeatOrders: number }[];
  topProducts: {
    name: string;
    revenue: number;
    units: number;
    aov: number;
    sku: string | null;
    change: number;
  }[];
  customerMix: {
    newPct: number;
    returningPct: number;
    newRevenue: number;
    returningRevenue: number;
    data: { date: string; new: number; returning: number }[];
  };
  shopifyRepeatData: {
    repeatRate: number;
    avgOrdersPerCustomer: number;
    repeatRevenuePct: number;
  };
  shopifyLTV: {
    overall: number;
    new30d: number;
    returning: number;
    byChannel: { channel: string; ltv: number; cacRatio: number }[];
  };
  rawCount: number;
}

interface MetaAccountKpis {
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  impressions: number;
  reach: number;
  cpa: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reachCPM: number;
  hookRate: number;
  engagementDepth: number;
}

interface MetaDailyTrend {
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

interface MetaAccountData {
  kpis: MetaAccountKpis | null;
  dailyTrend: MetaDailyTrend[];
}

interface MetaCampaign {
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
}

interface MetaCampaignsData {
  campaigns: MetaCampaign[];
}

interface Briefing {
  summary: string;
  highlights: string[];
}

// ── Channel performance row ──
interface ChannelRow {
  channel: string;
  label: string;
  revenue: number;
  spend: number;
  roas: number;
  roasChange: number;
  orders: number;
  cm: number;
  cmPct: number;
  share: number;
  color: string;
}

// ── Loading skeleton ──
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 animate-pulse">
      <div className="h-3 w-20 bg-zinc-800 rounded mb-3" />
      <div className="h-7 w-24 bg-zinc-800 rounded mb-2" />
      <div className="h-3 w-16 bg-zinc-800 rounded" />
      <div className="mt-3 h-8 w-full bg-zinc-800/50 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
      <div className="h-4 w-48 bg-zinc-800 rounded mb-4" />
      <div className="h-[300px] bg-zinc-800/30 rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
      <div className="h-4 w-40 bg-zinc-800 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-zinc-800/30 rounded" />
        ))}
      </div>
    </div>
  );
}

// ── Error state ──
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-red-400">Failed to load dashboard data</p>
        <p className="text-xs text-zinc-400 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 rounded px-3 py-1.5 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// ── Helper: format date to "MMM dd" ──
function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export default function DashboardPage() {
  const { days, startISO, endISO, refreshKey, setSyncing } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [shopifyData, setShopifyData] = useState<ShopifyData | null>(null);
  const [metaAccount, setMetaAccount] = useState<MetaAccountData | null>(null);
  const [metaCampaigns, setMetaCampaigns] = useState<MetaCampaign[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSyncing(true);
    try {
      const [shopifyRes, metaAccountRes, metaCampaignsRes] = await Promise.all([
        fetch(`/api/shopify?start=${startISO}&end=${endISO}`),
        fetch(`/api/meta?level=account&start=${startISO}&end=${endISO}`),
        fetch(`/api/meta?level=campaigns&start=${startISO}&end=${endISO}`),
      ]);

      if (!shopifyRes.ok) throw new Error(`Shopify API returned ${shopifyRes.status}`);
      if (!metaAccountRes.ok) throw new Error(`Meta API returned ${metaAccountRes.status}`);
      if (!metaCampaignsRes.ok) throw new Error(`Meta Campaigns API returned ${metaCampaignsRes.status}`);

      const [shopify, metaAcct, metaCamp] = await Promise.all([
        shopifyRes.json() as Promise<ShopifyData>,
        metaAccountRes.json() as Promise<MetaAccountData>,
        metaCampaignsRes.json() as Promise<MetaCampaignsData>,
      ]);

      setShopifyData(shopify);
      setMetaAccount(metaAcct);
      setMetaCampaigns(metaCamp.campaigns ?? []);
      setLoading(false);

      // After main data loads, fetch AI briefing in background
      fetchBriefing(shopify, metaAcct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    } finally {
      setSyncing(false);
    }
  }, [startISO, endISO, refreshKey, setSyncing]);

  const fetchBriefing = async (shopify: ShopifyData, meta: MetaAccountData) => {
    if (!meta.kpis) return;
    setBriefingLoading(true);
    try {
      const netRevenue = shopify.kpis.netRevenue.value;
      const adSpend = meta.kpis.spend;
      const blendedROAS = adSpend > 0 ? netRevenue / adSpend : 0;
      const cm = netRevenue - adSpend;
      const cmPct = netRevenue > 0 ? (cm / netRevenue) * 100 : 0;

      const res = await fetch("/api/ai/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          netRevenue,
          adSpend,
          blendedROAS,
          orders: shopify.kpis.orders.value,
          aov: shopify.kpis.aov.value,
          contributionMargin: cm,
          cmPct,
          topChannel: "Meta",
          topChannelROAS: meta.kpis.roas,
          metaSpend: meta.kpis.spend,
          metaRevenue: meta.kpis.revenue,
          metaROAS: meta.kpis.roas,
          newCustomerPct: shopify.kpis.newCustomerPct.value,
          refundRate: shopify.kpis.refundRate.value,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBriefing(data);
      }
    } catch {
      // Briefing is non-critical; silently fail
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`r1-${i}`} />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`r2-${i}`} />
          ))}
        </div>
        <SkeletonChart />
        <SkeletonTable />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="space-y-6">
        <ErrorBanner message={error} onRetry={fetchData} />
      </div>
    );
  }

  // ── Compute derived data ──
  const shopify = shopifyData!;
  const meta = metaAccount!;
  const metaKpis = meta.kpis;

  const netRevenue = shopify.kpis.netRevenue.value;
  const adSpend = metaKpis?.spend ?? 0;
  const blendedROAS = adSpend > 0 ? netRevenue / adSpend : 0;
  const contributionMargin = netRevenue - adSpend;
  const cmPct = netRevenue > 0 ? (contributionMargin / netRevenue) * 100 : 0;
  const orders = shopify.kpis.orders.value;
  const aov = shopify.kpis.aov.value;
  const newCustomerPct = shopify.kpis.newCustomerPct.value;

  // New Customer CAC = Ad Spend * (newCustomerPct/100) / newCustomers
  // newCustomers estimated from orders * newCustomerPct/100
  const newCustomers = Math.round(orders * (newCustomerPct / 100));
  const newCustomerCAC = newCustomers > 0 ? (adSpend * (newCustomerPct / 100)) / newCustomers : 0;

  // Daily sparklines from shopify daily revenue
  const revenueSparkline = shopify.dailyRevenue.map((d) => d.total);

  // Daily sparklines from meta daily trend
  const spendSparkline = meta.dailyTrend.map((d) => d.spend);
  const roasSparkline = meta.dailyTrend.map((d) => d.roas);

  // ── Revenue vs Spend chart (combined) ──
  // Merge shopify daily revenue + meta daily spend into one chart
  const metaDailyMap = new Map(meta.dailyTrend.map((d) => [d.date, d]));
  const shopifyDailyMap = new Map(shopify.dailyRevenue.map((d) => [d.date, d]));
  // Collect all dates from both
  const allDates = Array.from(
    new Set([
      ...meta.dailyTrend.map((d) => d.date),
      ...shopify.dailyRevenue.map((d) => d.date),
    ])
  ).sort();
  const revenueVsSpendData = allDates.map((date) => ({
    date: formatDateLabel(date),
    revenue: shopifyDailyMap.get(date)?.total ?? 0,
    spend: metaDailyMap.get(date)?.spend ?? 0,
  }));

  // ── Channel performance table ──
  // Meta campaigns as rows + Shopify organic/other as a row
  const metaRevenue = metaKpis?.revenue ?? 0;
  const metaOrders = metaKpis?.purchases ?? 0;
  const metaCM = metaRevenue - adSpend;

  // Shopify organic = total shopify revenue - meta attributed revenue
  const organicRevenue = Math.max(0, netRevenue - metaRevenue);
  const organicOrders = Math.max(0, orders - metaOrders);

  const channelPerformance: ChannelRow[] = [
    {
      channel: "meta",
      label: "Meta Ads",
      revenue: metaRevenue,
      spend: adSpend,
      roas: metaKpis?.roas ?? 0,
      roasChange: 0,
      orders: metaOrders,
      cm: metaCM,
      cmPct: metaRevenue > 0 ? (metaCM / metaRevenue) * 100 : 0,
      share: netRevenue > 0 ? (metaRevenue / netRevenue) * 100 : 0,
      color: "#1877F2",
    },
    {
      channel: "organic_other",
      label: "Organic / Other",
      revenue: organicRevenue,
      spend: 0,
      roas: Infinity,
      roasChange: 0,
      orders: organicOrders,
      cm: organicRevenue,
      cmPct: organicRevenue > 0 ? 100 : 0,
      share: netRevenue > 0 ? (organicRevenue / netRevenue) * 100 : 0,
      color: "#8B5CF6",
    },
  ];

  const maxRevenue = Math.max(...channelPerformance.map((c) => c.revenue), 1);
  const totalRevenue = channelPerformance.reduce((s, c) => s + c.revenue, 0);
  const totalSpend = channelPerformance.reduce((s, c) => s + c.spend, 0);
  const totalCM = channelPerformance.reduce((s, c) => s + c.cm, 0);
  const totalOrders = channelPerformance.reduce((s, c) => s + c.orders, 0);

  // ── Daily ROAS trend ──
  const dailyROASTrend = allDates.map((date) => {
    const metaDay = metaDailyMap.get(date);
    const shopifyDay = shopifyDailyMap.get(date);
    const dayRevenue = shopifyDay?.total ?? 0;
    const daySpend = metaDay?.spend ?? 0;
    return {
      date: formatDateLabel(date),
      roas: daySpend > 0 ? +(dayRevenue / daySpend).toFixed(2) : 0,
      target: 3.0,
    };
  });

  // ── Daily spend by channel ──
  const dailySpendByChannel = meta.dailyTrend.map((d) => ({
    date: formatDateLabel(d.date),
    meta: Math.round(d.spend),
    google: 0, // No Google data yet — placeholder
  }));

  // ── Customer acquisition section ──
  const custMix = shopify.customerMix;
  const returningCount = orders - newCustomers;
  const returningAov = returningCount > 0 ? custMix.returningRevenue / returningCount : 0;
  const repeatRate = shopify.shopifyRepeatData?.repeatRate ?? 0;
  const ltv = shopify.shopifyLTV?.overall ?? 0;
  const ltvCacRatio = newCustomerCAC > 0 ? +(ltv / newCustomerCAC).toFixed(1) : 0;

  // ── Top performers ──
  const topProduct = shopify.topProducts.length > 0 ? shopify.topProducts[0] : null;
  const topCampaign = metaCampaigns.length > 0
    ? metaCampaigns.sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))[0]
    : null;
  // For top ad, use the top campaign as a proxy (ad-level data requires a separate API call)
  const topAd = metaCampaigns.length > 0
    ? metaCampaigns.sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))[0]
    : null;

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Net Revenue"
          value={formatCurrency(netRevenue)}
          change={shopify.kpis.netRevenue.change}
          sparkline={revenueSparkline}
          tooltip={METRIC_TOOLTIPS.netRevenue}
        />
        <KPICard
          title="Ad Spend"
          value={formatCurrency(adSpend)}
          change={0}
          sparkline={spendSparkline}
          tooltip={METRIC_TOOLTIPS.adSpend}
        />
        <KPICard
          title="Blended ROAS (MER)"
          value={formatMultiplier(blendedROAS)}
          change={0}
          sparkline={roasSparkline}
          tooltip={METRIC_TOOLTIPS.blendedROAS}
        />
        <KPICard
          title="Contribution Margin"
          value={formatCurrency(contributionMargin)}
          change={0}
          sparkline={[]}
          subtitle={`${cmPct.toFixed(1)}%`}
          tooltip={METRIC_TOOLTIPS.contributionMargin}
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Orders"
          value={orders.toString()}
          change={shopify.kpis.orders.change}
          sparkline={shopify.dailyOrders.map((d) => d.newOrders + d.repeatOrders)}
          tooltip={METRIC_TOOLTIPS.orders}
        />
        <KPICard
          title="AOV"
          value={formatCurrency(aov, 2)}
          change={shopify.kpis.aov.change}
          sparkline={[]}
          tooltip={METRIC_TOOLTIPS.aov}
        />
        <KPICard
          title="New Customer CAC"
          value={formatCurrency(newCustomerCAC, 2)}
          change={0}
          invertTrend
          sparkline={[]}
          tooltip={METRIC_TOOLTIPS.newCustomerCAC}
        />
        <KPICard
          title="New Customer %"
          value={formatPercent(newCustomerPct)}
          change={shopify.kpis.newCustomerPct.change}
          sparkline={[]}
          tooltip={METRIC_TOOLTIPS.newCustomerPct}
        />
      </div>

      {/* Revenue vs Spend Chart */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Revenue vs Ad Spend — Last 7 Days
        </h3>
        <RevenueChart data={revenueVsSpendData} />
      </div>

      {/* Channel Performance — Clean Table with Inline Bars */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">
            Channel Performance
          </h3>
          <span className="text-xs text-zinc-600">Last 7 days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5">Channel</th>
                <th className="px-3 py-2.5 text-right">Revenue</th>
                <th className="px-3 py-2.5 w-[120px]"></th>
                <th className="px-3 py-2.5 text-right">Spend</th>
                <th className="px-3 py-2.5 text-right">ROAS</th>
                <th className="px-3 py-2.5 text-right">CM</th>
                <th className="px-3 py-2.5 text-right">CM %</th>
                <th className="px-3 py-2.5 text-right">Orders</th>
                <th className="px-3 py-2.5 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {channelPerformance.map((ch) => (
                <tr
                  key={ch.channel}
                  className="border-b border-border/50 data-row transition-colors"
                >
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ch.color }}
                      />
                      <span className="font-medium text-zinc-200">
                        {ch.label}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-medium">
                    {formatCurrency(ch.revenue)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-[6px] rounded-full bg-zinc-800/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(ch.revenue / maxRevenue) * 100}%`,
                          backgroundColor: ch.color,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {ch.spend > 0 ? (
                      formatCurrency(ch.spend)
                    ) : (
                      <span className="text-zinc-600">&mdash;</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-medium">
                      {ch.roas === Infinity ? "\u221E" : formatMultiplier(ch.roas)}
                    </span>
                    {ch.roas !== Infinity && ch.roasChange !== 0 && (
                      <span
                        className={clsx(
                          "ml-1.5 text-[10px]",
                          ch.roasChange > 0
                            ? "text-emerald-400"
                            : ch.roasChange < 0
                              ? "text-red-400"
                              : "text-zinc-500"
                        )}
                      >
                        {ch.roasChange > 0 ? "\u25B2" : ch.roasChange < 0 ? "\u25BC" : "\u2014"}
                        {Math.abs(ch.roasChange)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {formatCurrency(ch.cm)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-zinc-400">
                    {ch.cmPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {ch.orders}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-zinc-400">
                    {ch.share.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="border-t-2 border-border font-semibold">
                <td className="px-3 py-3 text-foreground">Total</td>
                <td className="px-3 py-3 text-right font-mono">
                  {formatCurrency(totalRevenue)}
                </td>
                <td></td>
                <td className="px-3 py-3 text-right font-mono">
                  {formatCurrency(totalSpend)}
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {totalSpend > 0 ? formatMultiplier(totalRevenue / totalSpend) : "\u221E"}
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {formatCurrency(totalCM)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-zinc-400">
                  {totalRevenue > 0 ? ((totalCM / totalRevenue) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {totalOrders}
                </td>
                <td className="px-3 py-3 text-right font-mono text-zinc-400">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Blended ROAS Trend + Daily Spend Allocation */}
      <div className="grid grid-cols-2 gap-4">
        {/* ROAS Trend */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Blended ROAS — 7 Day Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={dailyROASTrend}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
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
              />
              <YAxis
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
                  ((value: number, name: string) => [
                    name === "roas" ? `${value}x` : `${value}x`,
                    name === "roas" ? "ROAS" : "Target",
                  ]) as never
                }
              />
              <ReferenceLine
                y={3.0}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="roas"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#roasGrad)"
                dot={false}
                activeDot={{
                  r: 3,
                  fill: "#3B82F6",
                  stroke: "#18181B",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-3 bg-blue-500 rounded" />
              Blended ROAS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-3 bg-red-500 rounded opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #EF4444 0, #EF4444 3px, transparent 3px, transparent 6px)' }} />
              Target 3.0x
            </span>
          </div>
        </div>

        {/* Daily Spend by Channel */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Daily Ad Spend by Channel
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dailySpendByChannel}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
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
              />
              <YAxis
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
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
                  ((value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === "meta" ? "Meta" : "Google",
                  ]) as never
                }
              />
              <Bar
                dataKey="meta"
                stackId="spend"
                fill="#1877F2"
                radius={[0, 0, 0, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey="google"
                stackId="spend"
                fill="#4285F4"
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#1877F2]" />
              Meta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#4285F4]" />
              Google
            </span>
          </div>
        </div>
      </div>

      {/* Customer Acquisition + Top Performers */}
      <div className="grid grid-cols-5 gap-4">
        {/* Customer Acquisition — 2 cols */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Customer Acquisition
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
              <p className="text-[11px] uppercase tracking-wider text-emerald-400/70 mb-1">
                New Customers
              </p>
              <p className="text-xl font-mono font-semibold text-emerald-400">
                {newCustomers}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {formatCurrency(custMix.newRevenue)} rev
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                CAC{" "}
                <span className="font-mono">
                  {formatCurrency(newCustomerCAC, 2)}
                </span>
              </p>
            </div>
            <div className="rounded-md bg-blue-500/[0.06] border border-blue-500/20 p-3">
              <p className="text-[11px] uppercase tracking-wider text-blue-400/70 mb-1">
                Returning
              </p>
              <p className="text-xl font-mono font-semibold text-blue-400">
                {returningCount}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {formatCurrency(custMix.returningRevenue)} rev
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                AOV{" "}
                <span className="font-mono">
                  {formatCurrency(returningAov, 2)}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Repeat Rate
              </p>
              <p className="text-sm font-mono font-medium mt-0.5">
                {repeatRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                LTV
              </p>
              <p className="text-sm font-mono font-medium mt-0.5">
                {formatCurrency(ltv, 2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                LTV:CAC
              </p>
              <p className="text-sm font-mono font-medium mt-0.5">
                {ltvCacRatio}x
              </p>
            </div>
          </div>
        </div>

        {/* Top Performers — 3 cols */}
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {/* Best Ad (using top campaign as proxy) */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Top Ad
            </p>
            {topAd ? (
              <>
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {topAd.name}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Meta</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">ROAS</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {formatMultiplier(topAd.roas)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Revenue</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(topAd.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Spend</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(topAd.spend)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500 mt-2">No data</p>
            )}
          </div>

          {/* Best Product */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Top Product
            </p>
            {topProduct ? (
              <>
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {topProduct.name}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Shopify</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Revenue</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {formatCurrency(topProduct.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Units</span>
                    <span className="font-mono font-medium">
                      {topProduct.units}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">AOV</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(topProduct.aov, 2)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500 mt-2">No data</p>
            )}
          </div>

          {/* Best Campaign */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Top Campaign
            </p>
            {topCampaign ? (
              <>
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {topCampaign.name}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Meta</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">ROAS</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {formatMultiplier(topCampaign.roas)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Revenue</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(topCampaign.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Purchases</span>
                    <span className="font-mono font-medium">
                      {topCampaign.purchases}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500 mt-2">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">&#129302;</span>
          <h3 className="text-sm font-medium text-zinc-300">
            Datastore Daily Briefing &mdash; {todayStr}
          </h3>
        </div>
        {briefingLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-full bg-zinc-800 rounded" />
            <div className="h-4 w-3/4 bg-zinc-800 rounded" />
            <div className="h-4 w-1/2 bg-zinc-800 rounded" />
          </div>
        ) : briefing ? (
          <>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {briefing.summary}
            </p>
            {briefing.highlights && briefing.highlights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {briefing.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-zinc-800/60 px-2.5 py-0.5 text-[11px] text-zinc-400"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500">
            Generating briefing...
          </p>
        )}
      </div>

      {/* Active Alerts */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          Active Alerts (0)
        </h3>
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-sm text-zinc-500">No active alerts</p>
          <p className="text-xs text-zinc-600 mt-1">
            Alerts will appear here when anomalies are detected in your metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
