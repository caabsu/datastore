"use client";

import clsx from "clsx";

type Severity = "critical" | "warning" | "info";

interface AlertCardProps {
  id?: string | number;
  severity: Severity;
  channel: string;
  title: string;
  description: string;
  recommendation: string;
  timestamp: string;
  date: string;
}

const severityConfig: Record<Severity, { border: string; badge: string }> = {
  critical: { border: "border-l-negative", badge: "\uD83D\uDD34" },
  warning: { border: "border-l-warning", badge: "\uD83D\uDFE1" },
  info: { border: "border-l-accent", badge: "\uD83D\uDFE2" },
};

export default function AlertCard({
  severity,
  channel,
  title,
  description,
  recommendation,
  timestamp,
  date,
}: AlertCardProps) {
  const config = severityConfig[severity];

  return (
    <div
      className={clsx(
        "rounded-lg border border-border bg-surface p-4 border-l-4",
        config.border
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{config.badge}</span>
          <span className="text-sm font-medium capitalize">{severity}</span>
        </div>
        <button
          type="button"
          className="text-muted hover:text-foreground transition-colors text-xs"
          aria-label="Dismiss alert"
        >
          Dismiss
        </button>
      </div>

      {/* Title + Meta */}
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted">
        {channel} &middot; {date} &middot; {timestamp}
      </p>

      {/* Description */}
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{description}</p>

      {/* Recommendation */}
      <div className="mt-3 rounded-md bg-background px-3 py-2">
        <p className="text-xs text-muted">Recommendation</p>
        <p className="mt-0.5 text-xs text-zinc-300">{recommendation}</p>
      </div>
    </div>
  );
}
