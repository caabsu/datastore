"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

interface DashboardContextValue {
  /** Selected range start (inclusive) */
  startDate: Date;
  /** Selected range end (inclusive) */
  endDate: Date;
  /** Computed number of days in range */
  days: number;
  /** Which preset pill is active (null = custom range) */
  activePreset: number | null;
  /** Quick-select a preset (Today, 7d, 14d, 28d) */
  setPreset: (days: number) => void;
  /** Pick a custom date range */
  setDateRange: (start: Date, end: Date) => void;
  /** ISO strings for API calls */
  startISO: string;
  endISO: string;
  /** Incremented on each sync — pages re-fetch when this changes */
  refreshKey: number;
  /** Trigger a sync / refresh of all data */
  refresh: () => void;
  /** Whether a sync is in progress */
  syncing: boolean;
  setSyncing: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [endDate, setEndDate] = useState(() => endOfDay(new Date()));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDay(d);
  });
  const [activePreset, setActivePreset] = useState<number | null>(7);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const days = useMemo(
    () => Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000)),
    [startDate, endDate]
  );

  const startISO = useMemo(() => startDate.toISOString(), [startDate]);
  const endISO = useMemo(() => endDate.toISOString(), [endDate]);

  const setPreset = useCallback((d: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - d);
    setEndDate(endOfDay(now));
    setStartDate(startOfDay(start));
    setActivePreset(d);
  }, []);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setStartDate(startOfDay(start));
    setEndDate(endOfDay(end));
    setActivePreset(null);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        startDate,
        endDate,
        days,
        activePreset,
        setPreset,
        setDateRange,
        startISO,
        endISO,
        refreshKey,
        refresh,
        syncing,
        setSyncing,
      }}
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
