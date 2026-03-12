"use client";

import KPICard from "@/components/cards/KPICard";
import {
  shopifyKPIs,
  shopifyRevenueData,
  topProducts,
  customerMix,
  hourlyOrders,
  geoData,
} from "@/lib/mock-data";
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
} from "recharts";
import clsx from "clsx";

function formatDollar(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function ShopifyPage() {
  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          title="Net Revenue"
          value={formatCurrency(shopifyKPIs.netRevenue.value)}
          change={shopifyKPIs.netRevenue.change}
          sparkline={shopifyKPIs.netRevenue.sparkline}
        />
        <KPICard
          title="Orders"
          value={shopifyKPIs.orders.value.toString()}
          change={shopifyKPIs.orders.change}
          sparkline={shopifyKPIs.orders.sparkline}
        />
        <KPICard
          title="AOV"
          value={formatCurrency(shopifyKPIs.aov.value, 2)}
          change={shopifyKPIs.aov.change}
          sparkline={shopifyKPIs.aov.sparkline}
        />
        <KPICard
          title="Units / Order"
          value={shopifyKPIs.unitsPerOrder.value.toFixed(1)}
          change={shopifyKPIs.unitsPerOrder.change}
          sparkline={shopifyKPIs.unitsPerOrder.sparkline}
        />
        <KPICard
          title="Refund Rate"
          value={formatPercent(shopifyKPIs.refundRate.value)}
          change={shopifyKPIs.refundRate.change}
          invertTrend
          sparkline={shopifyKPIs.refundRate.sparkline}
        />
      </div>

      {/* ── Revenue Trend (Area Chart) ── */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Revenue Trend — Last 28 Days
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={shopifyRevenueData}
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

      {/* ── Customer Mix + Top Products ── */}
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
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={{ stroke: "#1F1F23" }}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
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

        {/* Top Products */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-400">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2 text-right">Revenue</th>
                  <th className="px-2 py-2 text-right">Units</th>
                  <th className="px-2 py-2 text-right">AOV</th>
                  <th className="px-2 py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const positive = p.change >= 0;
                  return (
                    <tr
                      key={p.sku}
                      className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-2 py-2 font-mono text-xs text-zinc-500">
                        {i + 1}
                      </td>
                      <td className="px-2 py-2 font-medium text-zinc-200">{p.name}</td>
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
                          positive ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {positive ? "+" : ""}
                        {p.change}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={{ stroke: "#1F1F23" }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
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
