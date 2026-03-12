"use client";

import clsx from "clsx";
import { formatCurrency, formatMultiplier } from "@/lib/format";

interface ChannelCardProps {
  label: string;
  spend: number;
  revenue: number;
  roas: number;
  roasChange: number;
  orders: number;
  color: string;
}

export default function ChannelCard({
  label,
  spend,
  revenue,
  roas,
  roasChange,
  orders,
  color,
}: ChannelCardProps) {
  const isFlat = Math.abs(roasChange) < 1;
  const isPositive = roasChange > 0;
  const trendColor = isFlat ? "text-muted" : isPositive ? "text-positive" : "text-negative";
  const arrow = isFlat ? "\u2014" : isPositive ? "\u25B2" : "\u25BC";

  return (
    <div
      className="rounded-lg border border-border bg-surface p-4 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <p className="text-sm font-semibold">{label}</p>

      <div className="mt-2 flex items-baseline justify-between text-xs">
        <div>
          <span className="text-muted">Spend </span>
          <span className="font-mono font-medium">{spend > 0 ? formatCurrency(spend) : "$0"}</span>
        </div>
        <div>
          <span className="text-muted">Rev </span>
          <span className="font-mono font-medium">{formatCurrency(revenue)}</span>
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted">ROAS</span>
          <span className="font-mono text-sm font-semibold">
            {roas === Infinity ? "∞" : formatMultiplier(roas)}
          </span>
        </div>
        <span className={clsx("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
          <span>{arrow}</span>
          <span>{Math.abs(roasChange).toFixed(1)}%</span>
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1 text-xs">
        <span className="text-muted">Orders</span>
        <span className="font-mono font-medium">{orders.toLocaleString()}</span>
      </div>
    </div>
  );
}
