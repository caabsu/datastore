"use client";

interface InsightCardProps {
  type: string;
  icon: string;
  date: string;
  summary: string;
}

export default function InsightCard({ type, icon, date, summary }: InsightCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold">{type}</span>
        </div>
        <span className="text-xs text-muted">{date}</span>
      </div>

      {/* Summary — clamped to 3 lines */}
      <p className="mt-3 text-xs leading-relaxed text-zinc-400 line-clamp-3">
        {summary}
      </p>

      {/* CTA */}
      <button
        type="button"
        className="mt-3 text-xs font-medium text-accent hover:underline transition-colors"
      >
        Read Full Briefing &rarr;
      </button>
    </div>
  );
}
