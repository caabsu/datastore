"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { metaAds, type MetaAd } from "@/lib/mock-data";
import {
  formatCurrency,
  formatPercent,
  formatMultiplier,
} from "@/lib/format";
import clsx from "clsx";

/* ───────── Helpers ───────── */

function TrendIndicator({
  value,
  invert = false,
}: {
  value: number | null;
  invert?: boolean;
}) {
  if (value === null) return <span className="text-zinc-600 text-[10px]">—</span>;
  const abs = Math.abs(value);
  if (abs < 1) {
    return (
      <span className="text-zinc-500 text-[10px] leading-none">— 0%</span>
    );
  }
  const isPositive = value > 0;
  const isGood = invert ? !isPositive : isPositive;
  const arrow = isPositive ? "▲" : "▼";
  const color = isGood ? "text-emerald-400" : "text-red-400";
  return (
    <span className={clsx("text-[10px] leading-none", color)}>
      {arrow} {abs.toFixed(1)}%
    </span>
  );
}

function MetricCell({
  value,
  formatted,
  trend,
  invertTrend = false,
  colorFn,
}: {
  value: number | null;
  formatted: string;
  trend: number | null;
  invertTrend?: boolean;
  colorFn?: (v: number) => string;
}) {
  if (value === null) {
    return <span className="text-zinc-600 font-mono">—</span>;
  }
  const colorClass = colorFn ? colorFn(value) : "";
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={clsx("font-mono text-sm", colorClass)}>{formatted}</span>
      <TrendIndicator value={trend} invert={invertTrend} />
    </div>
  );
}

function StatusBadge({ status }: { status: "Active" | "Paused" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        status === "Active"
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-500/10 text-zinc-400"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          status === "Active" ? "bg-emerald-400" : "bg-zinc-500"
        )}
      />
      {status}
    </span>
  );
}

/* ───────── Color thresholds ───────── */

const colorIncrROAS = (v: number) =>
  v >= 3.0 ? "text-emerald-400" : v >= 2.0 ? "text-yellow-400" : "text-red-400";

const colorReachCPM = (v: number) =>
  v <= 12 ? "text-emerald-400" : v <= 22 ? "text-yellow-400" : "text-red-400";

const colorIncrReachPct = (v: number) =>
  v >= 70 ? "text-emerald-400" : v >= 50 ? "text-yellow-400" : "text-red-400";

const colorCM = (v: number) =>
  v > 1000 ? "text-emerald-400" : v > 0 ? "text-yellow-400" : "text-red-400";

const colorCMPct = (v: number) =>
  v >= 30 ? "text-emerald-400" : v >= 15 ? "text-yellow-400" : "text-red-400";

const colorConvRate = (v: number) =>
  v >= 4 ? "text-emerald-400" : v >= 2.5 ? "text-yellow-400" : "text-red-400";

const colorHookRate = (v: number) =>
  v >= 30 ? "text-emerald-400" : v >= 20 ? "text-yellow-400" : "text-red-400";

const colorEngDepth = (v: number) =>
  v >= 4 ? "text-emerald-400" : v >= 2.5 ? "text-yellow-400" : "text-red-400";

const colorROAS = (v: number) =>
  v >= 4 ? "text-emerald-400" : v >= 2.5 ? "text-yellow-400" : "text-red-400";

const colorCPA = (v: number) =>
  v <= 30 ? "text-emerald-400" : v <= 50 ? "text-yellow-400" : "text-red-400";

const colorFatigue = (v: number) =>
  v <= 30 ? "text-emerald-400" : v <= 60 ? "text-yellow-400" : "text-red-400";

/* ───────── Row border logic ───────── */

function getRowBorderClass(ad: MetaAd): string {
  if (ad.contributionMargin < 0) return "border-l-2 border-l-red-500";
  if (ad.fatigueScore >= 70) return "border-l-2 border-l-yellow-500";
  if (
    ad.incrROAS !== null &&
    ad.incrROAS >= 3.0 &&
    ad.contributionMargin > 1000
  )
    return "border-l-2 border-l-emerald-500";
  return "";
}

/* ───────── Sort presets ───────── */

const SORT_PRESETS = [
  { label: "Default", sorting: [] as { id: string; desc: boolean }[] },
  {
    label: "Which ads should I scale?",
    sorting: [{ id: "incrROAS", desc: true }],
  },
  {
    label: "Which ads are wasting money?",
    sorting: [{ id: "contributionMargin", desc: false }],
  },
  { label: "Best hooks?", sorting: [{ id: "hookRate", desc: true }] },
  {
    label: "Highest efficiency?",
    sorting: [{ id: "roas", desc: true }],
  },
  {
    label: "Most fatigued?",
    sorting: [{ id: "fatigueScore", desc: true }],
  },
  {
    label: "Best engagement?",
    sorting: [{ id: "engagementDepth", desc: true }],
  },
];

/* ───────── Column definitions ───────── */

const identityColumns: ColumnDef<MetaAd, unknown>[] = [
  {
    accessorKey: "adName",
    header: "Ad Name",
    size: 220,
    cell: ({ row }) => (
      <span className="font-semibold text-foreground whitespace-nowrap">
        {row.original.adName}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "campaignName",
    header: "Campaign",
    size: 160,
    cell: ({ row }) => (
      <span className="text-muted text-xs">{row.original.campaignName}</span>
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
  {
    accessorKey: "daysActive",
    header: "Days",
    size: 60,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted">
        {row.original.daysActive}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "creativeType",
    header: "Type",
    size: 80,
    cell: ({ row }) => (
      <span className="text-xs text-muted">{row.original.creativeType}</span>
    ),
    enableHiding: false,
  },
];

const core7Columns: ColumnDef<MetaAd, unknown>[] = [
  {
    accessorKey: "incrROAS",
    header: "★ Incr. ROAS",
    size: 110,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.incrROAS}
        formatted={row.original.incrROAS !== null ? formatMultiplier(row.original.incrROAS) : "—"}
        trend={row.original.incrROASTrend}
        colorFn={colorIncrROAS}
      />
    ),
    sortingFn: (a, b) => {
      const aVal = a.original.incrROAS ?? -Infinity;
      const bVal = b.original.incrROAS ?? -Infinity;
      return aVal - bVal;
    },
  },
  {
    accessorKey: "reachCPM",
    header: "★ Reach CPM",
    size: 110,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.reachCPM}
        formatted={formatCurrency(row.original.reachCPM, 2)}
        trend={row.original.reachCPMTrend}
        invertTrend
        colorFn={colorReachCPM}
      />
    ),
  },
  {
    accessorKey: "incrReachPct",
    header: "★ Incr. Reach %",
    size: 120,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.incrReachPct}
        formatted={row.original.incrReachPct !== null ? formatPercent(row.original.incrReachPct) : "—"}
        trend={row.original.incrReachPctTrend}
        colorFn={colorIncrReachPct}
      />
    ),
    sortingFn: (a, b) => {
      const aVal = a.original.incrReachPct ?? -Infinity;
      const bVal = b.original.incrReachPct ?? -Infinity;
      return aVal - bVal;
    },
  },
  {
    accessorKey: "contributionMargin",
    header: "★ Contrib. Margin",
    size: 140,
    cell: ({ row }) => {
      const ad = row.original;
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className={clsx("font-mono text-sm", colorCM(ad.contributionMargin))}>
            {formatCurrency(ad.contributionMargin)}
          </span>
          <span className={clsx("font-mono text-[10px]", colorCMPct(ad.cmPct))}>
            {formatPercent(ad.cmPct)} CM
          </span>
          <TrendIndicator value={ad.cmTrend} />
        </div>
      );
    },
  },
  {
    accessorKey: "conversionRate",
    header: "★ Conv. Rate",
    size: 110,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.conversionRate}
        formatted={formatPercent(row.original.conversionRate)}
        trend={row.original.convRateTrend}
        colorFn={colorConvRate}
      />
    ),
  },
  {
    accessorKey: "aov",
    header: "AOV",
    size: 90,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {formatCurrency(row.original.aov)}
      </span>
    ),
  },
  {
    accessorKey: "hookRate",
    header: "★ Hook Rate",
    size: 110,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.hookRate}
        formatted={row.original.hookRate !== null ? formatPercent(row.original.hookRate) : "—"}
        trend={row.original.hookRateTrend}
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
    header: "★ Engage. Depth",
    size: 120,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.engagementDepth}
        formatted={row.original.engagementDepth.toFixed(1)}
        trend={row.original.engDepthTrend}
        colorFn={colorEngDepth}
      />
    ),
  },
];

const efficiencyColumns: ColumnDef<MetaAd, unknown>[] = [
  {
    accessorKey: "roas",
    header: "ROAS",
    size: 90,
    cell: ({ row }) => (
      <MetricCell
        value={row.original.roas}
        formatted={formatMultiplier(row.original.roas)}
        trend={row.original.roasTrend}
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
        trend={row.original.cpaTrend}
        invertTrend
        colorFn={colorCPA}
      />
    ),
  },
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
];

const lifecycleColumns: ColumnDef<MetaAd, unknown>[] = [
  {
    accessorKey: "fatigueScore",
    header: "Fatigue",
    size: 90,
    cell: ({ row }) => {
      const v = row.original.fatigueScore;
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-12 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full",
                v <= 30 ? "bg-emerald-500" : v <= 60 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className={clsx("font-mono text-xs", colorFatigue(v))}>
            {v}
          </span>
        </div>
      );
    },
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
    accessorKey: "reachCPMRatio",
    header: "Reach CPM Ratio",
    size: 120,
    cell: ({ row }) => {
      const v = row.original.reachCPMRatio;
      return (
        <span
          className={clsx(
            "font-mono text-sm",
            v <= 1.2 ? "text-emerald-400" : v <= 1.6 ? "text-yellow-400" : "text-red-400"
          )}
        >
          {v.toFixed(2)}x
        </span>
      );
    },
  },
];

/* ───────── Page Component ───────── */

export default function MetaAdsPage() {
  const [showCore7, setShowCore7] = useState(true);
  const [showEfficiency, setShowEfficiency] = useState(true);
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [sortPreset, setSortPreset] = useState(0);

  const columns = useMemo(() => {
    const cols: ColumnDef<MetaAd, unknown>[] = [...identityColumns];
    if (showCore7) cols.push(...core7Columns);
    if (showEfficiency) cols.push(...efficiencyColumns);
    if (showLifecycle) cols.push(...lifecycleColumns);
    return cols;
  }, [showCore7, showEfficiency, showLifecycle]);

  const sortedData = useMemo(() => {
    const preset = SORT_PRESETS[sortPreset];
    if (!preset || preset.sorting.length === 0) return metaAds;

    const { id, desc } = preset.sorting[0];
    return [...metaAds].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[id];
      const bVal = (b as unknown as Record<string, unknown>)[id];
      const aNum = aVal === null || aVal === undefined ? (desc ? -Infinity : Infinity) : Number(aVal);
      const bNum = bVal === null || bVal === undefined ? (desc ? -Infinity : Infinity) : Number(bVal);
      return desc ? bNum - aNum : aNum - bNum;
    });
  }, [sortPreset]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          All Meta Ads
        </h1>
        <p className="text-xs text-muted mt-1">
          Granular performance for every active and paused ad — Core 7 metrics with trend indicators
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
              checked={showCore7}
              onChange={(e) => setShowCore7(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-accent focus:ring-accent focus:ring-offset-0 h-3.5 w-3.5"
            />
            <span className="text-zinc-300">Core 7 Metrics</span>
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
              checked={showLifecycle}
              onChange={(e) => setShowLifecycle(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-accent focus:ring-accent focus:ring-offset-0 h-3.5 w-3.5"
            />
            <span className="text-zinc-300">Lifecycle</span>
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
          Fatiguing
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0.5 rounded bg-red-500" />
          Negative CM
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
                          key === "adName" ? "sticky" : undefined,
                        left: key === "adName" ? 0 : undefined,
                        zIndex: key === "adName" ? 10 : undefined,
                        background:
                          key === "adName" ? "var(--surface)" : undefined,
                      }}
                    >
                      {header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((ad) => (
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
                    const isSticky = key === "adName";

                    // Build a minimal context for the cell renderer
                    const fakeRow = { original: ad } as { original: MetaAd };
                    const rendered =
                      typeof cellFn === "function"
                        ? cellFn({
                            row: fakeRow,
                            getValue: () =>
                              (ad as unknown as Record<string, unknown>)[key],
                            renderValue: () =>
                              (ad as unknown as Record<string, unknown>)[key],
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-zinc-600 px-1">
        {sortedData.length} ads total &middot; ★ = Core 7 metric
      </div>
    </div>
  );
}
