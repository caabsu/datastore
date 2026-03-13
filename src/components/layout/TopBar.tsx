"use client";

import { clsx } from "clsx";
import { RefreshCw } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import DateRangePicker from "@/components/ui/DateRangePicker";

export default function TopBar() {
  const { refresh, syncing } = useDashboard();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div />

      {/* Date range picker + sync */}
      <div className="flex items-center gap-3">
        <DateRangePicker />

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
