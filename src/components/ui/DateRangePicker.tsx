"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";

const PRESETS = [
  { label: "Today", days: 1 },
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "28d", days: 28 },
] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatShortDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ── Single month grid ── */
function CalendarMonth({
  year,
  month,
  rangeStart,
  rangeEnd,
  hoverDate,
  onSelect,
  onHover,
}: {
  year: number;
  month: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  onSelect: (d: Date) => void;
  onHover: (d: Date | null) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const effectiveEnd = rangeEnd ?? hoverDate;

  return (
    <div>
      <div className="text-center text-xs font-medium text-foreground mb-2">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="h-7 flex items-center justify-center text-[10px] text-muted font-medium"
          >
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date)
            return <div key={`empty-${i}`} className="h-7 w-7" />;

          const isToday = isSameDay(date, today);
          const isStart = rangeStart && isSameDay(date, rangeStart);
          const isEnd = effectiveEnd && isSameDay(date, effectiveEnd);
          const inRange =
            rangeStart && effectiveEnd && isInRange(date, rangeStart, effectiveEnd);
          const isFuture = date > today;

          return (
            <button
              key={date.toISOString()}
              disabled={isFuture}
              onClick={() => onSelect(date)}
              onMouseEnter={() => onHover(date)}
              onMouseLeave={() => onHover(null)}
              className={clsx(
                "h-7 w-7 flex items-center justify-center text-[11px] rounded transition-colors",
                isFuture && "text-muted/30 cursor-not-allowed",
                !isFuture &&
                  !isStart &&
                  !isEnd &&
                  !inRange &&
                  "text-muted hover:bg-white/[0.06] hover:text-foreground",
                inRange &&
                  !isStart &&
                  !isEnd &&
                  "bg-accent/10 text-foreground",
                (isStart || isEnd) && "bg-accent text-white font-medium",
                isToday &&
                  !isStart &&
                  !isEnd &&
                  "ring-1 ring-accent/50"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main picker ── */
export default function DateRangePicker() {
  const { startDate, endDate, activePreset, setPreset, setDateRange } =
    useDashboard();
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // View month (right side of two-month calendar)
  const [viewDate, setViewDate] = useState(() => new Date());

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelecting("start");
        setTempStart(null);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const prevMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() - 1,
    1
  );

  function handleSelect(date: Date) {
    if (selecting === "start") {
      setTempStart(date);
      setSelecting("end");
    } else {
      if (tempStart) {
        const [s, e] =
          tempStart <= date ? [tempStart, date] : [date, tempStart];
        setDateRange(s, e);
        setOpen(false);
        setSelecting("start");
        setTempStart(null);
      }
    }
  }

  function handlePreset(days: number) {
    setPreset(days);
    setOpen(false);
    setSelecting("start");
    setTempStart(null);
  }

  const displayStart = tempStart ?? startDate;
  const displayEnd = selecting === "end" ? null : endDate;

  // Trigger button label
  const label =
    activePreset === 1
      ? "Today"
      : `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => {
          setOpen(!open);
          setSelecting("start");
          setTempStart(null);
        }}
        className={clsx(
          "flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors",
          open
            ? "text-foreground border-accent/50"
            : "text-muted hover:text-foreground"
        )}
      >
        <Calendar size={13} strokeWidth={1.8} />
        <span className="font-mono">{label}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-lg border border-border bg-surface shadow-xl p-4 w-[480px]">
          {/* Preset row */}
          <div className="flex items-center gap-1 mb-4 pb-3 border-b border-border">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => handlePreset(p.days)}
                className={clsx(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  activePreset === p.days
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                {p.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-muted">
              {selecting === "end"
                ? "Select end date"
                : "Select start date"}
            </span>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() =>
                setViewDate(
                  new Date(
                    viewDate.getFullYear(),
                    viewDate.getMonth() - 1,
                    1
                  )
                )
              }
              className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-white/[0.06]"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() =>
                setViewDate(
                  new Date(
                    viewDate.getFullYear(),
                    viewDate.getMonth() + 1,
                    1
                  )
                )
              }
              className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-white/[0.06]"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Two-month calendar */}
          <div className="grid grid-cols-2 gap-6">
            <CalendarMonth
              year={prevMonth.getFullYear()}
              month={prevMonth.getMonth()}
              rangeStart={displayStart}
              rangeEnd={displayEnd}
              hoverDate={selecting === "end" ? hoverDate : null}
              onSelect={handleSelect}
              onHover={setHoverDate}
            />
            <CalendarMonth
              year={viewDate.getFullYear()}
              month={viewDate.getMonth()}
              rangeStart={displayStart}
              rangeEnd={displayEnd}
              hoverDate={selecting === "end" ? hoverDate : null}
              onSelect={handleSelect}
              onHover={setHoverDate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
