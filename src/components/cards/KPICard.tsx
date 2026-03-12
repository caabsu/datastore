"use client";

import clsx from "clsx";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  prefix?: string;
  suffix?: string;
  subtitle?: string;
  sparkline?: number[];
  invertTrend?: boolean;
}

function getTrend(change: number, invertTrend: boolean) {
  if (Math.abs(change) < 1) {
    return { direction: "flat" as const, color: "text-muted", stroke: "var(--muted)" };
  }
  const isPositive = change > 0;
  const isGood = invertTrend ? !isPositive : isPositive;
  return {
    direction: isPositive ? ("up" as const) : ("down" as const),
    color: isGood ? "text-positive" : "text-negative",
    stroke: isGood ? "var(--positive)" : "var(--negative)",
  };
}

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  if (data.length < 2) return null;

  const width = 100;
  const height = 32;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 w-full"
      style={{ height: `${height}px` }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function KPICard({
  title,
  value,
  change,
  prefix,
  suffix,
  subtitle,
  sparkline,
  invertTrend = false,
}: KPICardProps) {
  const trend = getTrend(change, invertTrend);
  const arrow = trend.direction === "up" ? "\u25B2" : trend.direction === "down" ? "\u25BC" : "\u2014";

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{title}</p>

      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-mono font-semibold">
          {prefix}
          {value}
          {suffix}
        </p>
        {subtitle && (
          <span className="text-sm font-mono text-muted">{subtitle}</span>
        )}
      </div>

      <p className={clsx("mt-1 flex items-center gap-1 text-xs font-medium", trend.color)}>
        <span>{arrow}</span>
        <span>{Math.abs(change).toFixed(1)}%</span>
      </p>

      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} stroke={trend.stroke} />
      )}
    </div>
  );
}
