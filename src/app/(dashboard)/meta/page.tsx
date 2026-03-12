"use client";

import KPICard from "@/components/cards/KPICard";
import {
  metaKPIs,
  metaCampaigns,
} from "@/lib/mock-data";
import {
  formatCurrency,
  formatPercent,
  formatMultiplier,
} from "@/lib/format";

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Meta Ads Overview</h1>
        <p className="text-xs text-muted mt-1">
          Performance summary across all Meta campaigns — Last 7 days
        </p>
      </div>

      {/* KPI Cards Row 1 */}
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

      {/* KPI Cards Row 2 */}
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

      {/* Campaign Summary Table */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Campaign Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Campaign</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Spend</th>
                <th className="px-3 py-2.5 text-right">Reach CPM</th>
                <th className="px-3 py-2.5 text-right">Incr. Reach %</th>
                <th className="px-3 py-2.5 text-right">Incr. ROAS</th>
                <th className="px-3 py-2.5 text-right">CM</th>
                <th className="px-3 py-2.5 text-right">ROAS</th>
                <th className="px-3 py-2.5 text-right">Purchases</th>
              </tr>
            </thead>
            <tbody>
              {metaCampaigns.map((campaign) => (
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
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatCurrency(campaign.cm)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatMultiplier(campaign.roas)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {campaign.purchases}
                  </td>
                </tr>
              ))}

              {/* Account Total Row */}
              <tr className="border-t-2 border-border bg-surface-hover font-semibold">
                <td className="px-3 py-2.5 text-foreground">Account Total</td>
                <td className="px-3 py-2.5 text-muted">—</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatCurrency(accountTotals.spend)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted">
                  —
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted">
                  —
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted">
                  —
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
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
