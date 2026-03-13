"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatPercent, formatMultiplier } from "@/lib/format";
import { useDashboard } from "@/lib/dashboard-context";
import clsx from "clsx";

/* ───────── Types ───────── */

interface AdRow {
  id: string;
  name: string;
  adsetId: string;
  campaignId: string;
  status: string;
  creative: unknown;
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
  linkClicks: number;
  addToCart: number;
  initiateCheckout: number;
  hookRate: number;
  engagementDepth: number;
  date_start: string;
  date_stop: string;
}

interface CreativeRow {
  id: string;
  name: string;
  type: string;
  reachCPM: number;
  roas: number;
  cpa: number;
  hookRate: number | null;
  engagementDepth: number;
  ctr: number;
  score: number;
}

/* ───────── Derive creative type from ad name ───────── */

function deriveType(name: string): string {
  const lower = name.toLowerCase();
  if (/video|ugc|reel/.test(lower)) return "Video";
  if (/carousel|caro/.test(lower)) return "Carousel";
  return "Image";
}

/* ───────── Percentile helpers ───────── */

function getPercentileRank(
  values: (number | null)[],
  value: number | null
): "top" | "mid" | "bottom" | null {
  if (value === null || value === undefined) return null;
  const filtered = values.filter((v): v is number => v !== null && v !== undefined);
  if (filtered.length === 0) return null;
  const sorted = [...filtered].sort((a, b) => a - b);
  const idx = sorted.indexOf(value);
  if (idx === -1) {
    // Value may not be exactly in the array due to floating point;
    // find closest position
    const pos = sorted.filter((v) => v < value).length;
    const rank = sorted.length > 1 ? pos / (sorted.length - 1) : 0.5;
    if (rank >= 0.75) return "top";
    if (rank >= 0.25) return "mid";
    return "bottom";
  }
  const rank = sorted.length > 1 ? idx / (sorted.length - 1) : 0.5;
  if (rank >= 0.75) return "top";
  if (rank >= 0.25) return "mid";
  return "bottom";
}

function getPercentileRankInverse(
  values: (number | null)[],
  value: number | null
): "top" | "mid" | "bottom" | null {
  if (value === null || value === undefined) return null;
  const filtered = values.filter((v): v is number => v !== null && v !== undefined);
  if (filtered.length === 0) return null;
  const sorted = [...filtered].sort((a, b) => b - a);
  const idx = sorted.indexOf(value);
  if (idx === -1) {
    const pos = sorted.filter((v) => v > value).length;
    const rank = sorted.length > 1 ? pos / (sorted.length - 1) : 0.5;
    if (rank >= 0.75) return "top";
    if (rank >= 0.25) return "mid";
    return "bottom";
  }
  const rank = sorted.length > 1 ? idx / (sorted.length - 1) : 0.5;
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

/* ───────── Score computation ───────── */

/**
 * Compute percentile position (0–100) for a value in a list.
 * For "higher is better" metrics.
 */
function percentilePosition(values: number[], value: number): number {
  if (values.length <= 1) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  return (below / (sorted.length - 1)) * 100;
}

/**
 * Inverse percentile position (0–100) — lower value = higher percentile.
 * For "lower is better" metrics (reachCPM, cpa).
 */
function percentilePositionInverse(values: number[], value: number): number {
  if (values.length <= 1) return 50;
  const sorted = [...values].sort((a, b) => b - a);
  const below = sorted.filter((v) => v > value).length;
  return (below / (sorted.length - 1)) * 100;
}

function computeScores(ads: AdRow[]): CreativeRow[] {
  const allRoas = ads.map((a) => a.roas);
  const allReachCPM = ads.map((a) => a.reachCPM);
  const allCPA = ads.map((a) => a.cpa);
  const allHookRate = ads.map((a) => a.hookRate).filter((v): v is number => v != null);
  const allEngDepth = ads.map((a) => a.engagementDepth);
  const allCTR = ads.map((a) => a.ctr);

  return ads.map((ad) => {
    const metrics: number[] = [];

    // ROAS — higher is better
    metrics.push(percentilePosition(allRoas, ad.roas));

    // Reach CPM — lower is better
    metrics.push(percentilePositionInverse(allReachCPM, ad.reachCPM));

    // CPA — lower is better
    metrics.push(percentilePositionInverse(allCPA, ad.cpa));

    // Hook rate — higher is better (may be null)
    if (ad.hookRate != null && allHookRate.length > 0) {
      metrics.push(percentilePosition(allHookRate, ad.hookRate));
    }

    // Engagement depth — higher is better
    metrics.push(percentilePosition(allEngDepth, ad.engagementDepth));

    // CTR — higher is better
    metrics.push(percentilePosition(allCTR, ad.ctr));

    const score =
      metrics.length > 0
        ? Math.round(metrics.reduce((a, b) => a + b, 0) / metrics.length)
        : 0;

    return {
      id: ad.id,
      name: ad.name,
      type: deriveType(ad.name),
      reachCPM: ad.reachCPM,
      roas: ad.roas,
      cpa: ad.cpa,
      hookRate: ad.hookRate ?? null,
      engagementDepth: ad.engagementDepth,
      ctr: ad.ctr,
      score,
    };
  });
}

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

/* ───────── Loading skeleton ───────── */

function TableSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <th className="px-3 py-2.5">Creative</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5 text-right">Reach CPM</th>
              <th className="px-3 py-2.5 text-right">ROAS</th>
              <th className="px-3 py-2.5 text-right">CPA</th>
              <th className="px-3 py-2.5 text-right">Hook Rate</th>
              <th className="px-3 py-2.5 text-right">Engage Depth</th>
              <th className="px-3 py-2.5 text-right">CTR</th>
              <th className="px-3 py-2.5 text-right" style={{ minWidth: 140 }}>
                Score / 100
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="px-3 py-2.5">
                    <div className="h-4 rounded bg-zinc-800 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────── Component ───────── */

export default function CreativeAnalysisPage() {
  const { days, refreshKey } = useDashboard();
  const [creatives, setCreatives] = useState<CreativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAds() {
      try {
        setLoading(true);
        setError(null);
        const datePreset = days <= 1 ? "today" : days <= 7 ? "last_7d" : days <= 14 ? "last_14d" : "last_28d";
        const res = await fetch(`/api/meta?level=ads&date_preset=${datePreset}`);
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        const ads: AdRow[] = data.ads ?? [];
        if (ads.length === 0) {
          setCreatives([]);
        } else {
          setCreatives(computeScores(ads));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch ad data");
      } finally {
        setLoading(false);
      }
    }
    fetchAds();
  }, [days, refreshKey]);

  // Sort by score descending
  const sorted = [...creatives].sort((a, b) => b.score - a.score);

  // Precompute column values for percentile ranking
  const allReachCPM = sorted.map((c) => c.reachCPM);
  const allRoas = sorted.map((c) => c.roas);
  const allCPA = sorted.map((c) => c.cpa);
  const allHookRate = sorted.map((c) => c.hookRate);
  const allEngDepth = sorted.map((c) => c.engagementDepth);
  const allCTR = sorted.map((c) => c.ctr);
  const allScores = sorted.map((c) => c.score);

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
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
          <p className="font-medium">Failed to load creative data</p>
          <p className="text-red-400/70 mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && <TableSkeleton />}

      {/* Empty State */}
      {!loading && !error && creatives.length === 0 && (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-zinc-400">No ad data available for the selected period.</p>
        </div>
      )}

      {/* Matrix Table */}
      {!loading && !error && creatives.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5 sticky left-0 bg-surface z-10">
                    Creative
                  </th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5 text-right">Reach CPM</th>
                  <th className="px-3 py-2.5 text-right">ROAS</th>
                  <th className="px-3 py-2.5 text-right">CPA</th>
                  <th className="px-3 py-2.5 text-right">Hook Rate</th>
                  <th className="px-3 py-2.5 text-right">Engage Depth</th>
                  <th className="px-3 py-2.5 text-right">CTR</th>
                  <th className="px-3 py-2.5 text-right" style={{ minWidth: 140 }}>
                    Score / 100
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((creative) => {
                  const reachCPMRank = getPercentileRankInverse(allReachCPM, creative.reachCPM);
                  const roasRank = getPercentileRank(allRoas, creative.roas);
                  const cpaRank = getPercentileRankInverse(allCPA, creative.cpa);
                  const hookRateRank = getPercentileRank(allHookRate, creative.hookRate);
                  const engDepthRank = getPercentileRank(allEngDepth, creative.engagementDepth);
                  const ctrRank = getPercentileRank(allCTR, creative.ctr);

                  return (
                    <tr
                      key={creative.id}
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

                      {/* Reach CPM (lower is better) */}
                      <RankedCell rank={reachCPMRank}>
                        {formatCurrency(creative.reachCPM, 2)}
                      </RankedCell>

                      {/* ROAS */}
                      <RankedCell rank={roasRank}>
                        {formatMultiplier(creative.roas)}
                      </RankedCell>

                      {/* CPA (lower is better) */}
                      <RankedCell rank={cpaRank}>
                        {formatCurrency(creative.cpa, 2)}
                      </RankedCell>

                      {/* Hook Rate */}
                      <RankedCell rank={hookRateRank}>
                        {creative.hookRate !== null
                          ? formatPercent(creative.hookRate)
                          : "—"}
                      </RankedCell>

                      {/* Engage Depth */}
                      <RankedCell rank={engDepthRank}>
                        {creative.engagementDepth.toFixed(1)}
                      </RankedCell>

                      {/* CTR */}
                      <RankedCell rank={ctrRank}>
                        {formatPercent(creative.ctr)}
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
      )}

      {/* Insights Section */}
      {!loading && !error && creatives.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Creative Insights
          </h3>
          <p className="text-sm text-zinc-500">
            Creative insights will be generated from live data.
          </p>
        </div>
      )}
    </div>
  );
}
