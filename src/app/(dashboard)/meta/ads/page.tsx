"use client";

import { useState, useEffect, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  formatCurrency,
  formatPercent,
  formatMultiplier,
  formatNumber,
} from "@/lib/format";
import { useDashboard } from "@/lib/dashboard-context";
import clsx from "clsx";

/* ───────── Live API type ───────── */

interface LiveAd {
  id: string;
  name: string;
  adsetId: string;
  campaignId: string;
  status: string;
  creative: string | null;
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
  hookRate: number | null;
  engagementDepth: number | null;
  date_start: string;
  date_stop: string;
}

/* ───────── Helpers ───────── */

function MetricCell({
  value,
  formatted,
  colorFn,
}: {
  value: number | null;
  formatted: string;
  colorFn?: (v: number) => string;
}) {
  if (value === null || value === undefined) {
    return <span className="text-zinc-600 font-mono">--</span>;
  }
  const colorClass = colorFn ? colorFn(value) : "";
  return (
    <span className={clsx("font-mono text-sm", colorClass)}>{formatted}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status.toUpperCase() === "ACTIVE";
  const label = isActive ? "Active" : "Paused";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        isActive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-500/10 text-zinc-400"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-emerald-400" : "bg-zinc-500"
        )}
      />
      {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-zinc-800 rounded" />
      <div className="h-4 w-72 bg-zinc-800/60 rounded" />
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-surface p-3 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-44 bg-zinc-800 rounded" />
              <div className="h-4 w-28 bg-zinc-800/60 rounded" />
              <div className="h-4 w-16 bg-zinc-800/40 rounded" />
              <div className="h-4 w-20 bg-zinc-800/40 rounded" />
              <div className="h-4 w-20 bg-zinc-800/40 rounded" />
              <div className="h-4 w-16 bg-zinc-800/40 rounded" />
              <div className="h-4 w-16 bg-zinc-800/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Color thresholds ───────── */

const colorROAS = (v: number) =>
  v >= 4 ? "text-emerald-400" : v >= 2.5 ? "text-yellow-400" : "text-red-400";

const colorCPA = (v: number) =>
  v <= 30 ? "text-emerald-400" : v <= 50 ? "text-yellow-400" : "text-red-400";

const colorReachCPM = (v: number) =>
  v <= 12 ? "text-emerald-400" : v <= 22 ? "text-yellow-400" : "text-red-400";

const colorHookRate = (v: number) =>
  v >= 30 ? "text-emerald-400" : v >= 20 ? "text-yellow-400" : "text-red-400";

const colorEngDepth = (v: number) =>
  v >= 4 ? "text-emerald-400" : v >= 2.5 ? "text-yellow-400" : "text-red-400";

/* ───────── Row border logic ───────── */

function getRowBorderClass(ad: LiveAd): string {
  if (ad.roas >= 4.0 && ad.revenue > 1000)
    return "border-l-2 border-l-emerald-500";
  if (ad.roas < 1.0 && ad.spend > 50) return "border-l-2 border-l-red-500";
  if (ad.frequency > 2.5) return "border-l-2 border-l-yellow-500";
  return "";
}

/* ───────── Sort presets ───────── */

const SORT_PRESETS = [
  { label: "Default", sorting: [] as { id: string; desc: boolean }[] },
  { label: "Highest ROAS", sorting: [{ id: "roas", desc: true }] },
  { label: "Lowest CPA", sorting: [{ id: "cpa", desc: false }] },
  { label: "Most spend", sorting: [{ id: "spend", desc: true }] },
  { label: "Best hook rate", sorting: [{ id: "hookRate", desc: true }] },
  {
    label: "Best engagement",
    sorting: [{ id: "engagementDepth", desc: true }],
  },
  { label: "Highest frequency", sorting: [{ id: "frequency", desc: true }] },
];

/* ───────── Column definitions ───────── */

const identityColumns: ColumnDef<LiveAd, unknown>[] = [
  {
    accessorKey: "name",
    header: "Ad Name",
    size: 220,
    cell: ({ row }) => (
      <span className="font-semibold text-foreground whitespace-nowrap">
        {row.original.name}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "campaignId",
    header: "Campaign",
    size: 160,
    cell: ({ row }) => (
      <span className="text-muted text-xs font-mono">
        {row.original.campaignId}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 90,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    enableHiding: false,
  },
];

const performanceColumns: ColumnDef<LiveAd, unknown>[] = [
  {
    accessorKey: "spend",
    header: "Spend",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatCurrency(row.original.spend)}
      </span>
    ),
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatCurrency(row.original.revenue)}
      </span>
    ),
  },
  {
    accessorKey: "roas",
    header: "ROAS",
    size: 90,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.roas}
        formatted={formatMultiplier(row.original.roas)}
        colorFn={colorROAS}
      />
    ),
  },
  {
    accessorKey: "cpa",
    header: "CPA",
    size: 90,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.cpa}
        formatted={formatCurrency(row.original.cpa, 2)}
        colorFn={colorCPA}
      />
    ),
  },
  {
    accessorKey: "purchases",
    header: "Purchases",
    size: 90,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatNumber(row.original.purchases)}
      </span>
    ),
  },
];

const efficiencyColumns: ColumnDef<LiveAd, unknown>[] = [
  {
    accessorKey: "cpc",
    header: "CPC",
    size: 80,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatCurrency(row.original.cpc, 2)}
      </span>
    ),
  },
  {
    accessorKey: "ctr",
    header: "CTR",
    size: 80,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatPercent(row.original.ctr)}
      </span>
    ),
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    size: 90,
    cell: ({ row }) => (
      <span
        className={clsx(
          "font-mono text-sm",
          row.original.frequency <= 1.5
            ? "text-emerald-400"
            : row.original.frequency <= 2.5
            ? "text-yellow-400"
            : "text-red-400"
        )}
      >
        {row.original.frequency.toFixed(1)}
      </span>
    ),
  },
  {
    accessorKey: "reachCPM",
    header: "Reach CPM",
    size: 100,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.reachCPM}
        formatted={formatCurrency(row.original.reachCPM, 2)}
        colorFn={colorReachCPM}
      />
    ),
  },
  {
    accessorKey: "impressions",
    header: "Impressions",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatNumber(row.original.impressions)}
      </span>
    ),
  },
  {
    accessorKey: "reach",
    header: "Reach",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatNumber(row.original.reach)}
      </span>
    ),
  },
];

const creativeColumns: ColumnDef<LiveAd, unknown>[] = [
  {
    accessorKey: "hookRate",
    header: "Hook Rate",
    size: 100,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.hookRate}
        formatted={
          row.original.hookRate !== null
            ? formatPercent(row.original.hookRate)
            : "--"
        }
        colorFn={colorHookRate}
      />
    ),
    sortingFn: (a, b) => {
      const aVal = a.original.hookRate ?? -Infinity;
      const bVal = b.original.hookRate ?? -Infinity;
      return aVal - bVal;
    },
  },
  {
    accessorKey: "engagementDepth",
    header: "Engage. Depth",
    size: 110,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.engagementDepth}
        formatted={
          row.original.engagementDepth !== null
            ? row.original.engagementDepth.toFixed(1)
            : "--"
        }
        colorFn={colorEngDepth}
      />
    ),
    sortingFn: (a, b) => {
      const aVal = a.original.engagementDepth ?? -Infinity;
      const bVal = b.original.engagementDepth ?? -Infinity;
      return aVal - bVal;
    },
  },
];

/* ───────── Page Component ───────── */

export default function MetaAdsPage() {
  const { startISO, endISO, refreshKey } = useDashboard();
  const [ads, setAds] = useState<LiveAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPerformance, setShowPerformance] = useState(true);
  const [showEfficiency, setShowEfficiency] = useState(true);
  const [showCreative, setShowCreative] = useState(false);
  const [sortPreset, setSortPreset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchAds() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/meta?level=ads&start=${startISO}&end=${endISO}`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setAds(data.ads ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch ads data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchAds();
    return () => {
      cancelled = true;
    };
  }, [startISO, endISO, refreshKey]);

  const columns = useMemo(() => {
    const cols: ColumnDef<LiveAd, unknown>[] = [...identityColumns];
    if (showPerformance) cols.push(...performanceColumns);
    if (showEfficiency) cols.push(...efficiencyColumns);
    if (showCreative) cols.push(...creativeColumns);
    return cols;
  }, [showPerformance, showEfficiency, showCreative]);

  const sortedData = useMemo(() => {
    const preset = SORT_PRESETS[sortPreset];
    if (!preset || preset.sorting.length === 0) return ads;

    const { id, desc } = preset.sorting[0];
    return [...ads].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[id];
      const bVal = (b as unknown as Record<string, unknown>)[id];
      const aNum =
        aVal === null || aVal === undefined
          ? desc
            ? -Infinity
            : Infinity
          : Number(aVal);
      const bNum =
        bVal === null || bVal === undefined
          ? desc
            ? -Infinity
            : Infinity
          : Number(bVal);
      return desc ? bNum - aNum : aNum - bNum;
    });
  }, [sortPreset, ads]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            All Meta Ads
          </h1>
          <p className="text-xs text-muted mt-1">Loading live data...</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            All Meta Ads
          </h1>
        </div>
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-6 text-center">
          <p className="text-red-400 text-sm font-medium">
            Failed to load ads data
          </p>
          <p className="text-red-400/60 text-xs mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 text-xs bg-zinc-800 border border-border rounded-md text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          All Meta Ads
        </h1>
        <p className="text-xs text-muted mt-1">
          Live performance data for all ads — last 7 days
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6 bg-surface border border-border rounded-lg px-4 py-3">
        {/* Column group toggles */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
            Columns:
          </span>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showPerformance}
              onChange={(e) => setShowPerformance(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-accent focus:ring-accent focus:ring-offset-0 h-3.5 w-3.5"
            />
            <span className="text-zinc-300">Performance</span>
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showEfficiency}
              onChange={(e) => setShowEfficiency(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-accent focus:ring-accent focus:ring-offset-0 h-3.5 w-3.5"
            />
            <span className="text-zinc-300">Efficiency</span>
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showCreative}
              onChange={(e) => setShowCreative(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-accent focus:ring-accent focus:ring-offset-0 h-3.5 w-3.5"
            />
            <span className="text-zinc-300">Creative</span>
          </label>
        </div>

        {/* Sort presets */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
            Sort:
          </span>
          <select
            value={sortPreset}
            onChange={(e) => setSortPreset(Number(e.target.value))}
            className="bg-zinc-800 border border-border rounded-md px-2 py-1 text-sm text-zinc-300 focus:outline-none focus:border-accent cursor-pointer"
          >
            {SORT_PRESETS.map((preset, i) => (
              <option key={preset.label} value={i}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[10px] text-zinc-500 px-1">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0.5 rounded bg-emerald-500" />
          Top performer
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0.5 rounded bg-yellow-500" />
          High frequency
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0.5 rounded bg-red-500" />
          Low ROAS
        </span>
        <span className="flex items-center gap-1 ml-4">
          <span className="text-emerald-400">●</span> Good
          <span className="text-yellow-400 ml-2">●</span> Watch
          <span className="text-red-400 ml-2">●</span> Poor
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {columns.map((col) => {
                  const header =
                    typeof col.header === "string" ? col.header : "";
                  const key =
                    "accessorKey" in col
                      ? String(col.accessorKey)
                      : header;
                  return (
                    <th
                      key={key}
                      className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap"
                      style={{
                        width: col.size,
                        position:
                          key === "name" ? "sticky" : undefined,
                        left: key === "name" ? 0 : undefined,
                        zIndex: key === "name" ? 10 : undefined,
                        background:
                          key === "name" ? "var(--surface)" : undefined,
                      }}
                    >
                      {header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-8 text-center text-zinc-500 text-sm"
                  >
                    No ads found for the selected period.
                  </td>
                </tr>
              ) : (
                sortedData.map((ad) => (
                  <tr
                    key={ad.id}
                    className={clsx(
                      "border-b border-border/50 data-row transition-colors",
                      getRowBorderClass(ad)
                    )}
                  >
                    {columns.map((col) => {
                      const key =
                        "accessorKey" in col
                          ? String(col.accessorKey)
                          : "";
                      const cellFn = col.cell;
                      const isSticky = key === "name";

                      const fakeRow = { original: ad } as {
                        original: LiveAd;
                      };
                      const rendered =
                        typeof cellFn === "function"
                          ? cellFn({
                              row: fakeRow,
                              getValue: () =>
                                (ad as unknown as Record<string, unknown>)[
                                  key
                                ],
                              renderValue: () =>
                                (ad as unknown as Record<string, unknown>)[
                                  key
                                ],
                            } as never)
                          : (ad as unknown as Record<string, unknown>)[key];

                      return (
                        <td
                          key={key}
                          className={clsx(
                            "px-3 py-2.5 whitespace-nowrap",
                            isSticky && "sticky left-0 z-10 bg-[#0A0A0B]"
                          )}
                          style={{ width: col.size }}
                        >
                          {rendered as React.ReactNode}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-zinc-600 px-1">
        {sortedData.length} ads total
      </div>
    </div>
  );
}
