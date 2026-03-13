"use client";

import { clsx } from "clsx";
import { RefreshCw } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";

const dateRanges = [
  { label: "Today", days: 1 },
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "28d", days: 28 },
] as const;

export default function TopBar() {
  const { days, setDays, refresh, syncing } = useDashboard();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div />

      {/* Date range pills + sync */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {dateRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => setDays(range.days)}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                range.days === days
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button
          onClick={refresh}
          disabled={syncing}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground",
            syncing && "animate-spin text-accent"
          )}
          aria-label="Sync data"
          title="Sync data from all connected sources"
        >
          <RefreshCw size={14} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
