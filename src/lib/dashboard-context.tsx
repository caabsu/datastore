"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DashboardContextValue {
  /** Number of days for the selected date range (1=Today, 7, 14, 28) */
  days: number;
  setDays: (d: number) => void;
  /** Incremented on each sync — pages re-fetch when this changes */
  refreshKey: number;
  /** Trigger a sync / refresh of all data */
  refresh: () => void;
  /** Whether a sync is in progress (set by pages) */
  syncing: boolean;
  setSyncing: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState(7);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <DashboardContext.Provider
      value={{ days, setDays, refreshKey, refresh, syncing, setSyncing }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
