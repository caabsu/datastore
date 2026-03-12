"use client";

import KPICard from "@/components/cards/KPICard";
import ChannelCard from "@/components/cards/ChannelCard";
import AlertCard from "@/components/cards/AlertCard";
import RevenueChart from "@/components/charts/RevenueChart";
import ChannelDonut from "@/components/charts/ChannelDonut";
import {
  overviewKPIs,
  revenueVsSpendData,
  channelMix,
  channelDonutData,
  dailyBriefing,
  alerts,
} from "@/lib/mock-data";
import { formatCurrency, formatPercent, formatMultiplier } from "@/lib/format";

export default function DashboardPage() {
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
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Revenue vs Ad Spend — Last 28 Days</h3>
        <RevenueChart data={revenueVsSpendData} />
      </div>

      {/* Channel Performance + Donut */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Revenue by Channel</h3>
          <ChannelDonut data={channelDonutData} />
        </div>
        <div className="col-span-2 space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Channel Performance</h3>
          {channelMix.map((ch) => (
            <ChannelCard
              key={ch.channel}
              label={ch.label}
              spend={ch.spend}
              revenue={ch.revenue}
              roas={ch.roas}
              roasChange={ch.roasChange}
              orders={ch.orders}
              color={ch.color}
            />
          ))}
        </div>
      </div>

      {/* AI Briefing */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-medium text-zinc-300">Datastore Daily Briefing — {dailyBriefing.date}</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{dailyBriefing.summary}</p>
        <button className="mt-3 text-xs text-accent hover:text-blue-400 transition-colors">
          Read Full Briefing →
        </button>
      </div>

      {/* Active Alerts */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Active Alerts ({alerts.length})</h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} {...alert} />
          ))}
        </div>
      </div>
    </div>
  );
}
