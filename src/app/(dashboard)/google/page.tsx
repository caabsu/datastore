"use client";

import KPICard from "@/components/cards/KPICard";
import {
  googleKPIs,
  googleCampaigns,
  googlePmaxBreakdown,
  searchTerms,
} from "@/lib/mock-data";
import { formatCurrency, formatPercent, formatMultiplier } from "@/lib/format";

export default function GoogleAdsPage() {
  const totalPmaxSpend = googlePmaxBreakdown.reduce((s, c) => s + c.spend, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-lg font-semibold text-zinc-100">Google Ads Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        <KPICard
          title="Spend"
          value={formatCurrency(googleKPIs.spend.value)}
          change={googleKPIs.spend.change}
          sparkline={googleKPIs.spend.sparkline}
        />
        <KPICard
          title="Revenue"
          value={formatCurrency(googleKPIs.revenue.value)}
          change={googleKPIs.revenue.change}
          sparkline={googleKPIs.revenue.sparkline}
        />
        <KPICard
          title="ROAS"
          value={formatMultiplier(googleKPIs.roas.value)}
          change={googleKPIs.roas.change}
          sparkline={googleKPIs.roas.sparkline}
        />
        <KPICard
          title="Conversions"
          value={googleKPIs.conversions.value.toString()}
          change={googleKPIs.conversions.change}
          sparkline={googleKPIs.conversions.sparkline}
        />
        <KPICard
          title="CPA"
          value={formatCurrency(googleKPIs.cpa.value, 2)}
          change={googleKPIs.cpa.change}
          invertTrend
          sparkline={googleKPIs.cpa.sparkline}
        />
        <KPICard
          title="CTR"
          value={formatPercent(googleKPIs.ctr.value)}
          change={googleKPIs.ctr.change}
          sparkline={googleKPIs.ctr.sparkline}
        />
      </div>

      {/* Campaign Performance Table */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Campaign Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4 text-right">Spend</th>
                <th className="pb-3 pr-4 text-right">Revenue</th>
                <th className="pb-3 pr-4 text-right">ROAS</th>
                <th className="pb-3 pr-4 text-right">Conv.</th>
                <th className="pb-3 pr-4 text-right">CPA</th>
                <th className="pb-3 pr-4 text-right">CTR</th>
                <th className="pb-3 text-right">Impressions</th>
              </tr>
            </thead>
            <tbody>
              {googleCampaigns.map((c) => (
                <tr
                  key={c.name}
                  className="data-row border-b border-border/50 transition-colors"
                >
                  <td className="py-3 pr-4 font-medium text-zinc-200">
                    {c.name}
                  </td>
                  <td className="py-3 pr-4 text-muted">{c.type}</td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(c.spend)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(c.revenue)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatMultiplier(c.roas)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {c.conversions}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(c.cpa, 2)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatPercent(c.ctr)}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {c.impressions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PMax Channel Breakdown */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          PMax Channel Breakdown
        </h3>

        {/* Stacked bar visualization */}
        <div className="mb-4">
          <div className="flex h-8 w-full overflow-hidden rounded">
            {googlePmaxBreakdown.map((ch) => (
              <div
                key={ch.channel}
                className="flex items-center justify-center text-[10px] font-medium text-white transition-all"
                style={{
                  width: `${(ch.spend / totalPmaxSpend) * 100}%`,
                  backgroundColor: ch.color,
                }}
                title={`${ch.channel}: ${formatCurrency(ch.spend)}`}
              >
                {(ch.spend / totalPmaxSpend) * 100 > 10
                  ? ch.channel
                  : ""}
              </div>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-3 pr-4">Channel</th>
              <th className="pb-3 pr-4 text-right">Spend</th>
              <th className="pb-3 pr-4 text-right">% of Total</th>
              <th className="pb-3 pr-4 text-right">Conversions</th>
              <th className="pb-3 text-right">Impressions</th>
            </tr>
          </thead>
          <tbody>
            {googlePmaxBreakdown.map((ch) => (
              <tr
                key={ch.channel}
                className="data-row border-b border-border/50 transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ch.color }}
                    />
                    <span className="text-zinc-200">{ch.channel}</span>
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatCurrency(ch.spend)}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatPercent((ch.spend / totalPmaxSpend) * 100)}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {ch.conversions}
                </td>
                <td className="py-3 text-right font-mono">
                  {ch.impressions.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Search Terms */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Top Search Terms
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Term</th>
                <th className="pb-3 pr-4 text-right">Clicks</th>
                <th className="pb-3 pr-4 text-right">Impressions</th>
                <th className="pb-3 pr-4 text-right">Spend</th>
                <th className="pb-3 pr-4 text-right">Conv.</th>
                <th className="pb-3 pr-4 text-right">Conv. Value</th>
                <th className="pb-3 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {searchTerms.map((t) => (
                <tr
                  key={t.term}
                  className="data-row border-b border-border/50 transition-colors"
                >
                  <td className="py-3 pr-4 font-medium text-zinc-200">
                    {t.term}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {t.clicks.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {t.impressions.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(t.spend)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {t.conversions}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(t.convValue)}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {formatPercent(t.ctr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
