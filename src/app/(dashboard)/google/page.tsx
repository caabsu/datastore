"use client";

import clsx from "clsx";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import KPICard from "@/components/cards/KPICard";
import {
  googleKPIs,
  googleCampaigns,
  googlePmaxBreakdown,
  searchTerms,
  googleDailyTrend,
  googleDeviceBreakdown,
  googleKeywordCategories,
} from "@/lib/mock-data";
import { formatCurrency, formatPercent, formatMultiplier } from "@/lib/format";

const TOOLTIP_STYLE = {
  backgroundColor: "#18181B",
  border: "1px solid #27272A",
  borderRadius: 8,
};

const GOOGLE_BLUE = "#4285F4";

const GOOGLE_TOOLTIPS: Record<string, string> = {
  spend:
    "Total amount spent on Google Ads across Search, Shopping, and Performance Max campaigns. Sourced from Google Ads API reporting.",
  revenue:
    "Total conversion value attributed to Google Ads. Uses Google's last-click attribution model by default. Includes purchases tracked via Google Ads conversion tag.",
  roas:
    "Return on Ad Spend. Total Google Ads conversion value divided by total Google Ads spend. Formula: Google Revenue / Google Spend.",
  conversions:
    "Total purchase conversions attributed to Google Ads. Counted using the Google Ads conversion tracking pixel or imported from Google Analytics.",
  cpa:
    "Cost Per Acquisition. Average spend to generate one conversion. Formula: Google Spend / Conversions. Lower is better — trend is inverted so a decrease shows green.",
  ctr:
    "Click-Through Rate. Percentage of impressions that resulted in a click. Formula: Clicks / Impressions. Higher CTR indicates more relevant ad copy and targeting.",
};

export default function GoogleAdsPage() {
  const totalPmaxSpend = googlePmaxBreakdown.reduce((s, c) => s + c.spend, 0);
  const maxDeviceShare = Math.max(
    ...googleDeviceBreakdown.map((d) => d.share)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Google Ads Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Performance across Search, Shopping, and Performance Max campaigns
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        <KPICard
          title="Spend"
          value={formatCurrency(googleKPIs.spend.value)}
          change={googleKPIs.spend.change}
          sparkline={googleKPIs.spend.sparkline}
          tooltip={GOOGLE_TOOLTIPS.spend}
        />
        <KPICard
          title="Revenue"
          value={formatCurrency(googleKPIs.revenue.value)}
          change={googleKPIs.revenue.change}
          sparkline={googleKPIs.revenue.sparkline}
          tooltip={GOOGLE_TOOLTIPS.revenue}
        />
        <KPICard
          title="ROAS"
          value={formatMultiplier(googleKPIs.roas.value)}
          change={googleKPIs.roas.change}
          sparkline={googleKPIs.roas.sparkline}
          tooltip={GOOGLE_TOOLTIPS.roas}
        />
        <KPICard
          title="Conversions"
          value={googleKPIs.conversions.value.toString()}
          change={googleKPIs.conversions.change}
          sparkline={googleKPIs.conversions.sparkline}
          tooltip={GOOGLE_TOOLTIPS.conversions}
        />
        <KPICard
          title="CPA"
          value={formatCurrency(googleKPIs.cpa.value, 2)}
          change={googleKPIs.cpa.change}
          invertTrend
          sparkline={googleKPIs.cpa.sparkline}
          tooltip={GOOGLE_TOOLTIPS.cpa}
        />
        <KPICard
          title="CTR"
          value={formatPercent(googleKPIs.ctr.value)}
          change={googleKPIs.ctr.change}
          sparkline={googleKPIs.ctr.sparkline}
          tooltip={GOOGLE_TOOLTIPS.ctr}
        />
      </div>

      {/* Spend & Revenue Trend Chart */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Spend &amp; Revenue Trend
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={googleDailyTrend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="googleRevGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={GOOGLE_BLUE} stopOpacity={0.3} />
                  <stop
                    offset="100%"
                    stopColor={GOOGLE_BLUE}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F1F23"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis
                yAxisId="dollars"
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
                width={52}
              />
              <YAxis
                yAxisId="roas"
                orientation="right"
                tick={{ fill: "#71717A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v.toFixed(1)}x`}
                width={44}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#A1A1AA", fontSize: 12 }}
                formatter={((value: number, name: string) => {
                  if (name === "Revenue") return [formatCurrency(value), name];
                  if (name === "Spend") return [formatCurrency(value), name];
                  if (name === "ROAS") return [formatMultiplier(value), name];
                  return [value, name];
                }) as never}
              />
              <Area
                yAxisId="dollars"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                fill="url(#googleRevGradient)"
                stroke={GOOGLE_BLUE}
                strokeWidth={2}
              />
              <Line
                yAxisId="dollars"
                type="monotone"
                dataKey="spend"
                name="Spend"
                stroke="#A1A1AA"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
              <Line
                yAxisId="roas"
                type="monotone"
                dataKey="roas"
                name="ROAS"
                stroke="#22C55E"
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-6 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-5 rounded-sm"
              style={{ backgroundColor: GOOGLE_BLUE, opacity: 0.6 }}
            />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-5 border-t border-dashed border-zinc-400"
            />
            Spend
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-5 border-t-2 border-emerald-500"
            />
            ROAS
          </span>
        </div>
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
                  <td
                    className={clsx(
                      "py-3 pr-4 text-right font-mono",
                      c.roas >= 3.0
                        ? "text-emerald-400"
                        : c.roas >= 2.0
                        ? "text-zinc-200"
                        : "text-red-400"
                    )}
                  >
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

      {/* Device Breakdown + Keyword Categories — Two Column Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Device Breakdown */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-400">
            Device Breakdown
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-3">Device</th>
                <th className="pb-3 pr-3 text-right">Spend</th>
                <th className="pb-3 pr-3 text-right">Revenue</th>
                <th className="pb-3 pr-3 text-right">Conv.</th>
                <th className="pb-3 pr-3 text-right">CPA</th>
                <th className="pb-3 pr-3 text-right">CTR</th>
                <th className="pb-3 w-28">Share</th>
              </tr>
            </thead>
            <tbody>
              {googleDeviceBreakdown.map((d) => (
                <tr
                  key={d.device}
                  className="data-row border-b border-border/50 transition-colors"
                >
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-medium text-zinc-200">
                        {d.device}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {formatCurrency(d.spend)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {formatCurrency(d.revenue)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {d.conversions}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {formatCurrency(d.cpa, 2)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {formatPercent(d.ctr)}
                  </td>
                  <td className="py-3 w-28">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(d.share / maxDeviceShare) * 100}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-xs text-zinc-400">
                        {formatPercent(d.share)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keyword Category Performance */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-400">
            Keyword Category Performance
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-3">Category</th>
                <th className="pb-3 pr-3 text-right">Spend</th>
                <th className="pb-3 pr-3 text-right">Revenue</th>
                <th className="pb-3 pr-3 text-right">ROAS</th>
                <th className="pb-3 pr-3 text-right">Conv.</th>
                <th className="pb-3 pr-3 text-right">CPA</th>
                <th className="pb-3 text-right">Imp. Share</th>
              </tr>
            </thead>
            <tbody>
              {googleKeywordCategories.map((k) => (
                <tr
                  key={k.category}
                  className="data-row border-b border-border/50 transition-colors"
                >
                  <td className="py-3 pr-3 font-medium text-zinc-200">
                    {k.category}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {formatCurrency(k.spend)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {formatCurrency(k.revenue)}
                  </td>
                  <td
                    className={clsx(
                      "py-3 pr-3 text-right font-mono",
                      k.roas >= 3.0
                        ? "text-emerald-400"
                        : k.roas >= 2.0
                        ? "text-zinc-200"
                        : "text-red-400"
                    )}
                  >
                    {formatMultiplier(k.roas)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {k.conversions}
                  </td>
                  <td
                    className={clsx(
                      "py-3 pr-3 text-right font-mono",
                      k.cpa <= 40
                        ? "text-emerald-400"
                        : k.cpa <= 65
                        ? "text-zinc-200"
                        : "text-red-400"
                    )}
                  >
                    {formatCurrency(k.cpa, 2)}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={clsx(
                        "inline-block rounded px-1.5 py-0.5 font-mono text-xs",
                        k.impressionShare >= 80
                          ? "bg-emerald-500/10 text-emerald-400"
                          : k.impressionShare >= 30
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      )}
                    >
                      {formatPercent(k.impressionShare, 0)}
                    </span>
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
                {(ch.spend / totalPmaxSpend) * 100 > 10 ? ch.channel : ""}
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
