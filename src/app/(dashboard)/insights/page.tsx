"use client";

import { useState } from "react";
import InsightCard from "@/components/cards/InsightCard";
import AlertCard from "@/components/cards/AlertCard";
import { insightBriefings, alerts } from "@/lib/mock-data";
import { Search } from "lucide-react";

const PLACEHOLDER_QUESTIONS = [
  "Why did AOV increase this week?",
  "Which Meta ad should I pause next?",
  "Compare new vs returning customer revenue",
  "What is driving the refund rate down?",
];

const SEVERITY_OPTIONS = ["All", "Critical", "Warning", "Info"] as const;

export default function InsightsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("All");

  const filteredAlerts =
    severityFilter === "All"
      ? alerts
      : alerts.filter(
          (a) => a.severity === severityFilter.toLowerCase()
        );

  return (
    <div className="space-y-8">
      {/* ── Ask Datastore ── */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-200">Ask Datastore</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Ask anything about your brand performance. Powered by AI.
        </p>

        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Ask a question about your data..."
            className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none"
            readOnly
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PLACEHOLDER_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Briefings ── */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Today&apos;s Briefings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {insightBriefings.map((b) => (
            <InsightCard
              key={b.type}
              type={b.type}
              icon={b.icon}
              date={b.date}
              summary={b.summary}
            />
          ))}
        </div>
      </div>

      {/* ── Alert Feed ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">
            Alert Feed ({filteredAlerts.length})
          </h3>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-zinc-300 focus:border-accent focus:outline-none"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} {...alert} />
            ))
          ) : (
            <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-zinc-500">
              No alerts matching this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
