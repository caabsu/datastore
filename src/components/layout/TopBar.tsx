"use client";

import { clsx } from "clsx";
import { RefreshCw } from "lucide-react";

const dateRanges = ["Today", "7d", "14d", "28d", "Custom"] as const;

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const selected = "7d";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      {/* Date range pills + refresh */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {dateRanges.map((range) => (
            <button
              key={range}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                range === selected
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
          aria-label="Refresh data"
        >
          <RefreshCw size={14} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
