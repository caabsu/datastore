"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import KPICard from "@/components/cards/KPICard";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import clsx from "clsx";

/* ── Types matching /api/shopify response ── */
interface ShopifyAPIResponse {
  kpis: {
    netRevenue: { value: number; change: number };
    orders: { value: number; change: number };
    aov: { value: number; change: number };
    unitsPerOrder: { value: number; change: number };
    refundRate: { value: number; change: number };
    newCustomerPct: { value: number; change: number };
  };
  dailyRevenue: { date: string; total: number }[];
  dailyOrders: { date: string; newOrders: number; repeatOrders: number }[];
  topProducts: { name: string; revenue: number; units: number; aov: number; sku: string; change: number }[];
  rawCount: number;
  customerMix: {
    newPct: number;
    returningPct: number;
    newRevenue: number;
    returningRevenue: number;
    data: { date: string; new: number; returning: number }[];
  };
  hourlyOrders: { hour: string; orders: number }[];
  geoData: { state: string; orders: number; revenue: number }[];
  shopifyCategories: { category: string; revenue: number; units: number; aov: number; pct: number; change: number }[];
  shopifyLTV: {
    overall: number;
    new30d: number;
    returning: number;
    byChannel: { channel: string; ltv: number; cacRatio: number }[];
  };
  shopifyRepeatData: {
    repeatRate: number;
    avgTimeBetween: number | null;
    avgOrdersPerCustomer: number;
    repeatRevenuePct: number;
  };
  cohortData: {
    cohort: string;
    size: number;
    m0: number | null;
    m1: number | null;
    m2: number | null;
    m3: number | null;
    m4: number | null;
    m5: number | null;
  }[];
}

function formatDollar(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const tooltipStyle = {
  backgroundColor: "#18181B",
  border: "1px solid #27272A",
  borderRadius: 8,
  color: "#F4F4F5",
  fontSize: 13,
};

const tooltipLabelStyle = { color: "#71717A", marginBottom: 4 };

const axisTickStyle = { fill: "#71717A", fontSize: 12 };
const axisTickSmall = { fill: "#71717A", fontSize: 11 };

const SHOPIFY_TOOLTIPS: Record<string, string> = {
  netRevenue:
    "Total Shopify revenue after refunds and returns. Excludes tax and shipping unless configured. Formula: Gross Revenue - Refunds - Discounts. Sourced from Shopify Orders API.",
  orders:
    "Total completed orders in the selected period. Excludes cancelled and fully refunded orders. Includes both online and POS orders if applicable.",
  aov:
    "Average Order Value. Net revenue divided by total orders. Formula: Net Revenue / Orders. Influenced by bundling, upsells, and discount strategy.",
  unitsPerOrder:
    "Average number of line items per order. Higher values indicate successful cross-selling and bundling. Formula: Total Units Sold / Total Orders.",
  refundRate:
    "Percentage of orders that were fully or partially refunded. Formula: Refunded Orders / Total Orders. Lower is better — trend is inverted so a decrease shows green. Industry average for DTC is 5-8%.",
};

export default function ShopifyPage() {
  const { days, refreshKey, setSyncing } = useDashboard();
  const [data, setData] = useState<ShopifyAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setSyncing(true);
      try {
        const res = await fetch(`/api/shopify?days=${days}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `API error: ${res.status}`);
        }
        const json: ShopifyAPIResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Shopify data");
        }
      } finally {
        if (!cancelled) setLoading(false);
        setSyncing(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [days, refreshKey, setSyncing]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-sm text-zinc-500">Loading Shopify data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-4 text-sm text-red-400">
          {error ?? "Failed to load Shopify data"}
        </div>
      </div>
    );
  }

  const {
    kpis,
    dailyRevenue,
    dailyOrders: apiDailyOrders,
    topProducts: apiTopProducts,
    customerMix,
    hourlyOrders,
    geoData,
    shopifyCategories,
    shopifyLTV,
    shopifyRepeatData,
    cohortData,
  } = data;

  // Build sparkline arrays from dailyRevenue for KPI cards
  const revenueSparkline = dailyRevenue.map((d) => d.total);
  const ordersSparkline = apiDailyOrders.map((d) => d.newOrders + d.repeatOrders);

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          title="Net Revenue"
          value={formatCurrency(kpis.netRevenue.value)}
          change={kpis.netRevenue.change}
          sparkline={revenueSparkline}
          tooltip={SHOPIFY_TOOLTIPS.netRevenue}
        />
        <KPICard
          title="Orders"
          value={kpis.orders.value.toString()}
          change={kpis.orders.change}
          sparkline={ordersSparkline}
          tooltip={SHOPIFY_TOOLTIPS.orders}
        />
        <KPICard
          title="AOV"
          value={formatCurrency(kpis.aov.value, 2)}
          change={kpis.aov.change}
          tooltip={SHOPIFY_TOOLTIPS.aov}
        />
        <KPICard
          title="Units / Order"
          value={kpis.unitsPerOrder.value.toFixed(1)}
          change={kpis.unitsPerOrder.change}
          tooltip={SHOPIFY_TOOLTIPS.unitsPerOrder}
        />
        <KPICard
          title="Refund Rate"
          value={formatPercent(kpis.refundRate.value)}
          change={kpis.refundRate.change}
          invertTrend
          tooltip={SHOPIFY_TOOLTIPS.refundRate}
        />
      </div>

      {/* ── Revenue Trend (Area Chart) ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Revenue Trend — Last 28 Days
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={dailyRevenue}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="shopifyRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1F1F23" strokeDasharray="none" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisTickStyle}
              axisLine={{ stroke: "#1F1F23" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatDollar}
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              formatter={((value: number) => [formatDollar(value), "Revenue"]) as never}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#shopifyRevenueGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#22C55E", stroke: "#18181B", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Conversion Funnel — Not Available ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-2 text-sm font-medium text-zinc-400">
          Conversion Funnel
        </h3>
        <p className="text-xs text-zinc-500">
          Conversion funnel requires Shopify Analytics API (Plus plan). Session and funnel data is not available via the standard Admin API.
        </p>
      </div>

      {/* ── Customer Mix + Daily Orders by Type ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Customer Mix */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-400">Customer Mix</h3>

          {/* Summary Bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${customerMix.newPct}%` }}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${customerMix.returningPct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  New {formatPercent(customerMix.newPct)} &middot;{" "}
                  {formatCurrency(customerMix.newRevenue)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                  Returning {formatPercent(customerMix.returningPct)} &middot;{" "}
                  {formatCurrency(customerMix.returningRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Stacked Area — daily new vs returning % */}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={customerMix.data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              stackOffset="expand"
            >
              <CartesianGrid stroke="#1F1F23" strokeDasharray="none" vertical={false} />
              <XAxis
                dataKey="date"
                tick={axisTickSmall}
                axisLine={{ stroke: "#1F1F23" }}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={axisTickSmall}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{ ...tooltipStyle, fontSize: 12 }}
                labelStyle={tooltipLabelStyle}
                formatter={((value: number, name: string) => [
                  `${value}%`,
                  name === "new" ? "New" : "Returning",
                ]) as never}
              />
              <Area
                type="monotone"
                dataKey="new"
                stackId="1"
                stroke="#22C55E"
                fill="#22C55E"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="returning"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Orders by Type */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-400">
            Daily Orders by Type — Last 28 Days
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={apiDailyOrders}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid stroke="#1F1F23" strokeDasharray="none" vertical={false} />
              <XAxis
                dataKey="date"
                tick={axisTickSmall}
                axisLine={{ stroke: "#1F1F23" }}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tick={axisTickSmall}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{ ...tooltipStyle, fontSize: 12 }}
                labelStyle={tooltipLabelStyle}
                formatter={((value: number, name: string) => [
                  value,
                  name === "newOrders" ? "New Orders" : "Repeat Orders",
                ]) as never}
              />
              <Legend
                formatter={(value: string) =>
                  value === "newOrders" ? "New Orders" : "Repeat Orders"
                }
                wrapperStyle={{ fontSize: 12, color: "#71717A" }}
              />
              <Bar
                dataKey="newOrders"
                stackId="orders"
                fill="#22C55E"
                radius={[0, 0, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="repeatOrders"
                stackId="orders"
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Product Category Breakdown ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Product Category Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Revenue</th>
                <th className="px-3 py-2 text-right">Units</th>
                <th className="px-3 py-2 text-right">AOV</th>
                <th className="px-3 py-2" style={{ minWidth: 200 }}>
                  Share
                </th>
                <th className="px-3 py-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {shopifyCategories.map((cat) => {
                const positive = cat.change >= 0;
                return (
                  <tr
                    key={cat.category}
                    className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2 font-medium text-zinc-200">
                      {cat.category}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                      {formatCurrency(cat.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                      {cat.units.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                      {formatCurrency(cat.aov, 2)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cat.pct}%`,
                              backgroundColor: "#96BF48",
                            }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-xs text-zinc-400">
                          {formatPercent(cat.pct)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={clsx(
                        "px-3 py-2 text-right font-mono text-xs",
                        positive ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {positive ? "+" : ""}
                      {cat.change}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Products ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">Top Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2 text-right">Revenue</th>
                <th className="px-2 py-2 text-right">Units</th>
                <th className="px-2 py-2 text-right">AOV</th>
                <th className="px-2 py-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {apiTopProducts.map((p, i) => {
                const changePositive = p.change >= 0;
                return (
                  <tr
                    key={p.sku || p.name}
                    className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-2 py-2 font-mono text-xs text-zinc-500">
                      {i + 1}
                    </td>
                    <td className="px-2 py-2 font-medium text-zinc-200">{p.name}</td>
                    <td className="px-2 py-2 font-mono text-xs text-zinc-500">{p.sku || "—"}</td>
                    <td className="px-2 py-2 text-right font-mono text-zinc-300">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-zinc-300">
                      {p.units.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-zinc-300">
                      {formatCurrency(p.aov, 2)}
                    </td>
                    <td
                      className={clsx(
                        "px-2 py-2 text-right font-mono text-xs",
                        p.change === 0
                          ? "text-zinc-500"
                          : changePositive
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {p.change === 0 ? "—" : `${changePositive ? "+" : ""}${p.change}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Customer Lifetime Value ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Customer Lifetime Value
        </h3>

        {/* LTV Summary Cards */}
        <div className="mb-5 grid grid-cols-3 gap-4">
          <div className="rounded-md border border-border bg-[#0A0A0B] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Overall LTV</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-zinc-100">
              {formatCurrency(shopifyLTV.overall, 2)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-[#0A0A0B] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">New (30d) LTV</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-zinc-100">
              {formatCurrency(shopifyLTV.new30d, 2)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-[#0A0A0B] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Returning LTV</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-zinc-100">
              {formatCurrency(shopifyLTV.returning, 2)}
            </p>
          </div>
        </div>

        {/* LTV by Channel + Repeat Purchase Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* LTV by Channel */}
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              LTV by Channel
            </h4>
            {shopifyLTV.byChannel.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2">Channel</th>
                    <th className="px-3 py-2 text-right">LTV</th>
                    <th className="px-3 py-2 text-right">LTV:CAC</th>
                  </tr>
                </thead>
                <tbody>
                  {shopifyLTV.byChannel.map((ch) => (
                    <tr
                      key={ch.channel}
                      className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2 font-medium text-zinc-200">
                        {ch.channel}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-300">
                        {formatCurrency(ch.ltv, 2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-300">
                        {ch.cacRatio === Infinity ? (
                          <span className="text-emerald-400">&infin;</span>
                        ) : (
                          `${ch.cacRatio.toFixed(1)}x`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rounded-md border border-border bg-[#0A0A0B] px-4 py-6 text-center">
                <p className="text-xs text-zinc-500">
                  Channel LTV requires attribution data
                </p>
              </div>
            )}
          </div>

          {/* Repeat Purchase Stats */}
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Repeat Purchase Stats
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-[#0A0A0B] p-3">
                <p className="text-xs text-zinc-500">Repeat Rate</p>
                <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                  {formatPercent(shopifyRepeatData.repeatRate)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-[#0A0A0B] p-3">
                <p className="text-xs text-zinc-500">Avg Time Between</p>
                <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                  {shopifyRepeatData.avgTimeBetween !== null
                    ? `${shopifyRepeatData.avgTimeBetween}d`
                    : "N/A"}
                </p>
              </div>
              <div className="rounded-md border border-border bg-[#0A0A0B] p-3">
                <p className="text-xs text-zinc-500">Avg Orders / Customer</p>
                <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                  {shopifyRepeatData.avgOrdersPerCustomer.toFixed(2)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-[#0A0A0B] p-3">
                <p className="text-xs text-zinc-500">Repeat Revenue %</p>
                <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                  {formatPercent(shopifyRepeatData.repeatRevenuePct)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cohort Retention ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Cohort Retention
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2">Cohort</th>
                <th className="px-3 py-2 text-right">Size</th>
                <th className="px-3 py-2 text-center">M0</th>
                <th className="px-3 py-2 text-center">M1</th>
                <th className="px-3 py-2 text-center">M2</th>
                <th className="px-3 py-2 text-center">M3</th>
                <th className="px-3 py-2 text-center">M4</th>
                <th className="px-3 py-2 text-center">M5</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((row) => {
                const months = [row.m0, row.m1, row.m2, row.m3, row.m4, row.m5];
                return (
                  <tr
                    key={row.cohort}
                    className="border-b border-border/50"
                  >
                    <td className="px-3 py-2 font-medium text-zinc-200">
                      {row.cohort}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                      {row.size.toLocaleString()}
                    </td>
                    {months.map((val, mi) => {
                      if (val === null) {
                        return (
                          <td
                            key={mi}
                            className="px-3 py-2 text-center"
                          >
                            <span className="inline-block rounded px-2 py-1 font-mono text-xs bg-zinc-800 text-zinc-600">
                              —
                            </span>
                          </td>
                        );
                      }

                      // Heat map: higher retention = more green, lower = more red
                      // M0 is always 100%, so just show it neutral/bright
                      let bgColor: string;
                      let textColor: string;
                      if (val === 100) {
                        bgColor = "rgba(150, 191, 72, 0.2)";
                        textColor = "#96BF48";
                      } else if (val >= 30) {
                        bgColor = "rgba(34, 197, 94, 0.2)";
                        textColor = "#22C55E";
                      } else if (val >= 20) {
                        bgColor = "rgba(34, 197, 94, 0.12)";
                        textColor = "#4ADE80";
                      } else if (val >= 15) {
                        bgColor = "rgba(250, 204, 21, 0.12)";
                        textColor = "#FACC15";
                      } else {
                        bgColor = "rgba(239, 68, 68, 0.12)";
                        textColor = "#F87171";
                      }

                      return (
                        <td key={mi} className="px-3 py-2 text-center">
                          <span
                            className="inline-block rounded px-2 py-1 font-mono text-xs font-medium"
                            style={{ backgroundColor: bgColor, color: textColor }}
                          >
                            {formatPercent(val)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Hourly Orders ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Orders by Hour — Today
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={hourlyOrders}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="#1F1F23" strokeDasharray="none" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={axisTickSmall}
              axisLine={{ stroke: "#1F1F23" }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={axisTickSmall}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{ ...tooltipStyle, fontSize: 12 }}
              labelStyle={tooltipLabelStyle}
              formatter={((value: number) => [value, "Orders"]) as never}
            />
            <Bar
              dataKey="orders"
              fill="#8B5CF6"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Geography ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Top States by Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Revenue</th>
                <th className="px-3 py-2 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {geoData.map((g, i) => {
                const totalOrders = geoData.reduce((s, d) => s + d.orders, 0);
                const pct = ((g.orders / totalOrders) * 100).toFixed(1);
                return (
                  <tr
                    key={g.state}
                    className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-zinc-500">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-200">{g.state}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                      {g.orders}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                      {formatCurrency(g.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-400">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
