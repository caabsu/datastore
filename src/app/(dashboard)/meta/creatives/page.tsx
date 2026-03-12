"use client";

import { creativeMatrix } from "@/lib/mock-data";
import { formatCurrency, formatPercent, formatMultiplier } from "@/lib/format";
import clsx from "clsx";

/* ───────── Percentile helpers ───────── */

function getPercentileRank(values: (number | null)[], value: number | null): "top" | "mid" | "bottom" | null {
  if (value === null) return null;
  const filtered = values.filter((v): v is number => v !== null);
  if (filtered.length === 0) return null;
  const sorted = [...filtered].sort((a, b) => a - b);
  const rank = sorted.indexOf(value) / (sorted.length - 1);
  if (rank >= 0.75) return "top";
  if (rank >= 0.25) return "mid";
  return "bottom";
}

function getPercentileRankInverse(values: (number | null)[], value: number | null): "top" | "mid" | "bottom" | null {
  if (value === null) return null;
  const filtered = values.filter((v): v is number => v !== null);
  if (filtered.length === 0) return null;
  const sorted = [...filtered].sort((a, b) => b - a);
  const rank = sorted.indexOf(value) / (sorted.length - 1);
  if (rank >= 0.75) return "top";
  if (rank >= 0.25) return "mid";
  return "bottom";
}

const rankStyles = {
  top: "bg-emerald-500/15 text-emerald-400",
  mid: "bg-yellow-500/15 text-yellow-400",
  bottom: "bg-red-500/15 text-red-400",
};

function RankedCell({
  rank,
  children,
}: {
  rank: "top" | "mid" | "bottom" | null;
  children: React.ReactNode;
}) {
  if (rank === null) {
    return (
      <td className="px-3 py-2.5 text-right font-mono text-sm text-zinc-600">
        —
      </td>
    );
  }
  return (
    <td
      className={clsx(
        "px-3 py-2.5 text-right font-mono text-sm",
        rankStyles[rank]
      )}
    >
      {children}
    </td>
  );
}

/* ───────── Precompute column values for percentile ranking ───────── */

const allIncrROAS = creativeMatrix.map((c) => c.incrROAS);
const allReachCPM = creativeMatrix.map((c) => c.reachCPM);
const allIncrReachPct = creativeMatrix.map((c) => c.incrReachPct);
const allCM = creativeMatrix.map((c) => c.cm);
const allConvRate = creativeMatrix.map((c) => c.convRate);
const allHookRate = creativeMatrix.map((c) => c.hookRate);
const allEngDepth = creativeMatrix.map((c) => c.engDepth);
const allScores = creativeMatrix.map((c) => c.score);

/* ───────── Score bar color ───────── */

function scoreBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

/* ───────── Insights (hardcoded from mock data analysis) ───────── */

const insights = [
  "\"Influencer Testimonial\" scores highest (84/100) with the best hook rate (42.5%) and engagement depth (6.2) of any ad. Early signs point to strong creative-market fit — prioritize budget scaling.",
  "\"Lifestyle Carousel\" achieves the highest Incr. ROAS (4.1x) despite being a non-video format, proving that well-structured carousels can outperform video on incrementality.",
  "\"UGC Summer Vibes\" is the worst performer (12/100) with a fatigue score of 85 and negative contribution margin (-$42). Its reach CPM ($28.60) is 2x the account average — pause immediately.",
  "\"Unboxing Experience\" (Paused) was correctly paused — its 92 fatigue score and -$180 CM confirm creative exhaustion after 42 days. Avoid reactivation.",
  "Video creatives dominate hook rate but images/carousels show higher conversion rates in retargeting contexts. Consider a mixed creative strategy by funnel stage.",
  "Prospecting ads with Incr. Reach % above 70% (\"Lifestyle Carousel\" at 78%, \"UGC Spring\" at 72%, \"Influencer Testimonial\" at 82%) correlate with positive contribution margin — use incremental reach as a leading indicator for scaling decisions.",
];

/* ───────── Component ───────── */

export default function CreativeAnalysisPage() {
  // Sort by score descending
  const sorted = [...creativeMatrix].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Creative Analysis Matrix
        </h1>
        <p className="text-xs text-muted mt-1">
          Each cell is color-coded by percentile rank — green (top quartile),
          yellow (middle), red (bottom quartile)
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/30" />
          Top quartile
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-500/30" />
          Middle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/30" />
          Bottom quartile
        </span>
        <span className="ml-2 text-zinc-600">★ = Core 7 metric</span>
      </div>

      {/* Matrix Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <th className="px-3 py-2.5 sticky left-0 bg-surface z-10">
                  Creative
                </th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">★ Incr ROAS</th>
                <th className="px-3 py-2.5 text-right">★ Reach CPM</th>
                <th className="px-3 py-2.5 text-right">★ Incr Reach%</th>
                <th className="px-3 py-2.5 text-right">★ CM</th>
                <th className="px-3 py-2.5 text-right">★ Conv Rate</th>
                <th className="px-3 py-2.5 text-right">★ Hook Rate</th>
                <th className="px-3 py-2.5 text-right">★ Engage Depth</th>
                <th className="px-3 py-2.5 text-right" style={{ minWidth: 140 }}>
                  Score / 100
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((creative) => {
                const incrROASRank = getPercentileRank(allIncrROAS, creative.incrROAS);
                const reachCPMRank = getPercentileRankInverse(allReachCPM, creative.reachCPM);
                const incrReachRank = getPercentileRank(allIncrReachPct, creative.incrReachPct);
                const cmRank = getPercentileRank(allCM, creative.cm);
                const convRateRank = getPercentileRank(allConvRate, creative.convRate);
                const hookRateRank = getPercentileRank(allHookRate, creative.hookRate);
                const engDepthRank = getPercentileRank(allEngDepth, creative.engDepth);
                const scoreRank = getPercentileRank(allScores, creative.score);

                return (
                  <tr
                    key={creative.name}
                    className="border-b border-border/50 data-row transition-colors"
                  >
                    {/* Name — sticky */}
                    <td className="px-3 py-2.5 sticky left-0 bg-[#0A0A0B] z-10 font-medium text-foreground whitespace-nowrap">
                      {creative.name}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {creative.type}
                    </td>

                    {/* Incr. ROAS */}
                    <RankedCell rank={incrROASRank}>
                      {creative.incrROAS !== null
                        ? formatMultiplier(creative.incrROAS)
                        : "—"}
                    </RankedCell>

                    {/* Reach CPM (lower is better) */}
                    <RankedCell rank={reachCPMRank}>
                      {formatCurrency(creative.reachCPM, 2)}
                    </RankedCell>

                    {/* Incr. Reach % */}
                    <RankedCell rank={incrReachRank}>
                      {creative.incrReachPct !== null
                        ? formatPercent(creative.incrReachPct)
                        : "—"}
                    </RankedCell>

                    {/* CM */}
                    <RankedCell rank={cmRank}>
                      {formatCurrency(creative.cm)}
                    </RankedCell>

                    {/* Conv Rate */}
                    <RankedCell rank={convRateRank}>
                      {formatPercent(creative.convRate)}
                    </RankedCell>

                    {/* Hook Rate */}
                    <RankedCell rank={hookRateRank}>
                      {creative.hookRate !== null
                        ? formatPercent(creative.hookRate)
                        : "—"}
                    </RankedCell>

                    {/* Engage Depth */}
                    <RankedCell rank={engDepthRank}>
                      {creative.engDepth.toFixed(1)}
                    </RankedCell>

                    {/* Score with bar */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="h-2 w-16 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full transition-all",
                              scoreBarColor(creative.score)
                            )}
                            style={{ width: `${creative.score}%` }}
                          />
                        </div>
                        <span
                          className={clsx(
                            "font-mono text-sm font-semibold tabular-nums min-w-[2rem] text-right",
                            scoreTextColor(creative.score)
                          )}
                        >
                          {creative.score}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          Creative Insights
        </h3>
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-400 leading-relaxed">
              <span className="text-accent mt-0.5 flex-shrink-0">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
