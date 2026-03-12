"use client";

import KPICard from "@/components/cards/KPICard";
import AlertCard from "@/components/cards/AlertCard";
import RevenueChart from "@/components/charts/RevenueChart";
import {
  overviewKPIs,
  revenueVsSpendData,
  channelPerformance,
  dailyROASTrend,
  customerAcquisition,
  topPerformers,
  dailySpendByChannel,
  dailyBriefing,
  alerts,
} from "@/lib/mock-data";
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

export default function DashboardPage() {
  const maxRevenue = Math.max(...channelPerformance.map((c) => c.revenue));
  const totalRevenue = channelPerformance.reduce((s, c) => s + c.revenue, 0);
  const totalSpend = channelPerformance.reduce((s, c) => s + c.spend, 0);
  const totalCM = channelPerformance.reduce((s, c) => s + c.cm, 0);
  const totalOrders = channelPerformance.reduce((s, c) => s + c.orders, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Net Revenue"
          value={formatCurrency(overviewKPIs.netRevenue.value)}
          change={overviewKPIs.netRevenue.change}
          sparkline={overviewKPIs.netRevenue.sparkline}
        />
        <KPICard
          title="Ad Spend"
          value={formatCurrency(overviewKPIs.adSpend.value)}
          change={overviewKPIs.adSpend.change}
          sparkline={overviewKPIs.adSpend.sparkline}
        />
        <KPICard
          title="Blended ROAS (MER)"
          value={formatMultiplier(overviewKPIs.blendedROAS.value)}
          change={overviewKPIs.blendedROAS.change}
          sparkline={overviewKPIs.blendedROAS.sparkline}
        />
        <KPICard
          title="Contribution Margin"
          value={formatCurrency(overviewKPIs.contributionMargin.value)}
          change={overviewKPIs.contributionMargin.change}
          sparkline={overviewKPIs.contributionMargin.sparkline}
          subtitle={`${overviewKPIs.contributionMargin.pct}%`}
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Orders"
          value={overviewKPIs.orders.value.toString()}
          change={overviewKPIs.orders.change}
          sparkline={overviewKPIs.orders.sparkline}
        />
        <KPICard
          title="AOV"
          value={formatCurrency(overviewKPIs.aov.value, 2)}
          change={overviewKPIs.aov.change}
          sparkline={overviewKPIs.aov.sparkline}
        />
        <KPICard
          title="New Customer CAC"
          value={formatCurrency(overviewKPIs.newCustomerCAC.value, 2)}
          change={overviewKPIs.newCustomerCAC.change}
          invertTrend
          sparkline={overviewKPIs.newCustomerCAC.sparkline}
        />
        <KPICard
          title="New Customer %"
          value={formatPercent(overviewKPIs.newCustomerPct.value)}
          change={overviewKPIs.newCustomerPct.change}
          sparkline={overviewKPIs.newCustomerPct.sparkline}
        />
      </div>

      {/* Revenue vs Spend Chart */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Revenue vs Ad Spend — Last 28 Days
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
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-medium">
                      {ch.roas === Infinity ? "∞" : formatMultiplier(ch.roas)}
                    </span>
                    {ch.roas !== Infinity && (
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
                        {ch.roasChange > 0 ? "▲" : ch.roasChange < 0 ? "▼" : "—"}
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
                  {formatMultiplier(totalRevenue / totalSpend)}
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {formatCurrency(totalCM)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-zinc-400">
                  {((totalCM / totalRevenue) * 100).toFixed(1)}%
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
            Blended ROAS — 28 Day Trend
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
                interval={6}
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
                interval={6}
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
                {customerAcquisition.new.count}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {formatCurrency(customerAcquisition.new.revenue)} rev
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                CAC{" "}
                <span className="font-mono">
                  {formatCurrency(customerAcquisition.new.cac, 2)}
                </span>
              </p>
            </div>
            <div className="rounded-md bg-blue-500/[0.06] border border-blue-500/20 p-3">
              <p className="text-[11px] uppercase tracking-wider text-blue-400/70 mb-1">
                Returning
              </p>
              <p className="text-xl font-mono font-semibold text-blue-400">
                {customerAcquisition.returning.count}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {formatCurrency(customerAcquisition.returning.revenue)} rev
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                AOV{" "}
                <span className="font-mono">
                  {formatCurrency(customerAcquisition.returning.aov, 2)}
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
                {customerAcquisition.repeatRate}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                LTV
              </p>
              <p className="text-sm font-mono font-medium mt-0.5">
                {formatCurrency(customerAcquisition.ltv, 2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                LTV:CAC
              </p>
              <p className="text-sm font-mono font-medium mt-0.5">
                {customerAcquisition.ltvCacRatio}x
              </p>
            </div>
          </div>
        </div>

        {/* Top Performers — 3 cols */}
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {/* Best Ad */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Top Ad
            </p>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {topPerformers.ad.name}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {topPerformers.ad.channel}
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">ROAS</span>
                <span className="font-mono font-medium text-emerald-400">
                  {formatMultiplier(topPerformers.ad.roas)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">CM</span>
                <span className="font-mono font-medium">
                  {formatCurrency(topPerformers.ad.cm)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Hook Rate</span>
                <span className="font-mono font-medium">
                  {topPerformers.ad.hookRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Best Product */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Top Product
            </p>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {topPerformers.product.name}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Shopify</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Revenue</span>
                <span className="font-mono font-medium text-emerald-400">
                  {formatCurrency(topPerformers.product.revenue)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Units</span>
                <span className="font-mono font-medium">
                  {topPerformers.product.units}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Change</span>
                <span className="font-mono font-medium text-emerald-400">
                  +{topPerformers.product.change}%
                </span>
              </div>
            </div>
          </div>

          {/* Best Campaign */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Top Campaign
            </p>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {topPerformers.campaign.name}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {topPerformers.campaign.channel}
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">ROAS</span>
                <span className="font-mono font-medium text-emerald-400">
                  {formatMultiplier(topPerformers.campaign.roas)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">CM</span>
                <span className="font-mono font-medium">
                  {formatCurrency(topPerformers.campaign.cm)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Purchases</span>
                <span className="font-mono font-medium">
                  {topPerformers.campaign.purchases}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-medium text-zinc-300">
            Datastore Daily Briefing — {dailyBriefing.date}
          </h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {dailyBriefing.summary}
        </p>
        {dailyBriefing.highlights && (
          <div className="mt-3 flex flex-wrap gap-2">
            {dailyBriefing.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-zinc-800/60 px-2.5 py-0.5 text-[11px] text-zinc-400"
              >
                {h}
              </span>
            ))}
          </div>
        )}
        <button className="mt-3 text-xs text-accent hover:text-blue-400 transition-colors">
          Read Full Briefing →
        </button>
      </div>

      {/* Active Alerts */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          Active Alerts ({alerts.length})
        </h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} {...alert} />
          ))}
        </div>
      </div>
    </div>
  );
}
