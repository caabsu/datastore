"use client";

import { useState, useEffect } from "react";
import InsightCard from "@/components/cards/InsightCard";
import AlertCard from "@/components/cards/AlertCard";
import { Search } from "lucide-react";

// ── Types ──

interface ShopifyKPI {
  value: number;
  change: number;
}

interface ShopifyData {
  kpis: {
    netRevenue: ShopifyKPI;
    orders: ShopifyKPI;
    aov: ShopifyKPI;
    unitsPerOrder: ShopifyKPI;
    refundRate: ShopifyKPI;
    newCustomerPct: ShopifyKPI;
  };
}

interface MetaKPIs {
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  reach: number;
  cpa: number;
  hookRate: number;
  engagementDepth: number;
  reachCPM: number;
}

interface MetaData {
  kpis: MetaKPIs | null;
}

interface Briefing {
  summary: string;
  highlights: string[];
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  channel: string;
  title: string;
  description: string;
  recommendation: string;
  timestamp: string;
  date: string;
}

// ── Constants ──

const PLACEHOLDER_QUESTIONS = [
  "Why did AOV increase this week?",
  "Which Meta ad should I pause next?",
  "Compare new vs returning customer revenue",
  "What is driving the refund rate down?",
];

const SEVERITY_OPTIONS = ["All", "Critical", "Warning", "Info"] as const;

// ── Alert computation from live data ──

function computeAlerts(
  shopify: ShopifyData | null,
  meta: MetaData | null
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  let alertId = 1;

  // Critical: ROAS < 1.5 (losing money on ads)
  if (meta?.kpis && meta.kpis.roas > 0 && meta.kpis.roas < 1.5) {
    alerts.push({
      id: String(alertId++),
      severity: "critical",
      channel: "meta",
      title: `Meta ROAS at ${meta.kpis.roas.toFixed(2)}x — below profitability threshold`,
      description: `Current blended ROAS is ${meta.kpis.roas.toFixed(2)}x, well below the 1.5x break-even threshold. Ad spend of $${meta.kpis.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is generating only $${meta.kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in revenue.`,
      recommendation:
        "Review underperforming campaigns immediately. Pause ads with ROAS below 1.0 and reallocate budget to top performers.",
      timestamp: timeStr,
      date: dateStr,
    });
  }

  // Warning: New customer % < 30%
  if (shopify?.kpis?.newCustomerPct && shopify.kpis.newCustomerPct.value < 30) {
    alerts.push({
      id: String(alertId++),
      severity: "warning",
      channel: "shopify",
      title: `New customer share at ${shopify.kpis.newCustomerPct.value.toFixed(1)}% — below 30% threshold`,
      description: `Only ${shopify.kpis.newCustomerPct.value.toFixed(1)}% of orders are from first-time buyers. Over-reliance on returning customers can indicate declining acquisition efficiency.`,
      recommendation:
        "Increase prospecting budget allocation. Review Meta top-of-funnel campaigns and consider refreshing creatives to attract new audiences.",
      timestamp: timeStr,
      date: dateStr,
    });
  }

  // Warning: Refund rate > 10%
  if (shopify?.kpis?.refundRate && shopify.kpis.refundRate.value > 10) {
    alerts.push({
      id: String(alertId++),
      severity: "warning",
      channel: "shopify",
      title: `Refund rate at ${shopify.kpis.refundRate.value.toFixed(1)}% — exceeds 10% threshold`,
      description: `Refund rate of ${shopify.kpis.refundRate.value.toFixed(1)}% is significantly above the acceptable 10% threshold, impacting net revenue and margins.`,
      recommendation:
        "Investigate top refunded products and reasons. Check for product quality issues, sizing problems, or misleading descriptions.",
      timestamp: timeStr,
      date: dateStr,
    });
  }

  // Info: Any metric with > 20% change vs previous period
  if (shopify?.kpis) {
    const kpiChecks: { name: string; kpi: ShopifyKPI; label: string }[] = [
      { name: "Net Revenue", kpi: shopify.kpis.netRevenue, label: "netRevenue" },
      { name: "Orders", kpi: shopify.kpis.orders, label: "orders" },
      { name: "AOV", kpi: shopify.kpis.aov, label: "aov" },
      { name: "Units per Order", kpi: shopify.kpis.unitsPerOrder, label: "unitsPerOrder" },
      { name: "Refund Rate", kpi: shopify.kpis.refundRate, label: "refundRate" },
      { name: "New Customer %", kpi: shopify.kpis.newCustomerPct, label: "newCustomerPct" },
    ];

    for (const { name, kpi } of kpiChecks) {
      if (Math.abs(kpi.change) > 20) {
        const direction = kpi.change > 0 ? "up" : "down";
        alerts.push({
          id: String(alertId++),
          severity: "info",
          channel: "shopify",
          title: `${name} ${direction} ${Math.abs(kpi.change).toFixed(1)}% vs previous period`,
          description: `${name} changed by ${kpi.change > 0 ? "+" : ""}${kpi.change.toFixed(1)}% compared to the previous period. Current value: ${typeof kpi.value === "number" && kpi.value > 100 ? kpi.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.value.toFixed(1)}.`,
          recommendation: `Investigate what drove this ${Math.abs(kpi.change).toFixed(0)}% shift in ${name}. Check for promotions, seasonality, or channel changes.`,
          timestamp: timeStr,
          date: dateStr,
        });
      }
    }
  }

  return alerts;
}

// ── Skeleton Components ──

function BriefingSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 rounded bg-zinc-800" />
        <div className="h-4 w-40 rounded bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-800" />
        <div className="h-3 w-5/6 rounded bg-zinc-800" />
        <div className="h-3 w-4/6 rounded bg-zinc-800" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-24 rounded-full bg-zinc-800" />
        <div className="h-6 w-28 rounded-full bg-zinc-800" />
        <div className="h-6 w-20 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

function AlertSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 border-l-4 border-l-zinc-700 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 rounded bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-800" />
      </div>
      <div className="h-4 w-3/4 rounded bg-zinc-800 mb-2" />
      <div className="h-3 w-1/3 rounded bg-zinc-800 mb-3" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-zinc-800" />
        <div className="h-3 w-5/6 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

// ── Page Component ──

export default function InsightsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [shopifyData, setShopifyData] = useState<ShopifyData | null>(null);
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  // Step 1: Fetch Shopify + Meta data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [shopifyRes, metaRes] = await Promise.all([
          fetch("/api/shopify?days=7"),
          fetch("/api/meta?level=account"),
        ]);

        let shopify: ShopifyData | null = null;
        let meta: MetaData | null = null;

        if (shopifyRes.ok) {
          shopify = await shopifyRes.json();
          setShopifyData(shopify);
        } else {
          console.error("Shopify API error:", shopifyRes.status);
        }

        if (metaRes.ok) {
          meta = await metaRes.json();
          setMetaData(meta);
        } else {
          console.error("Meta API error:", metaRes.status);
        }

        if (!shopify && !meta) {
          setError("Unable to fetch data from Shopify or Meta APIs.");
        }

        // Compute alerts from live data
        const computedAlerts = computeAlerts(shopify, meta);
        setAlerts(computedAlerts);
      } catch (err) {
        console.error("Data fetch error:", err);
        setError("Failed to connect to data APIs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Step 2: Generate AI briefing once we have data
  useEffect(() => {
    if (loading) return;
    if (!shopifyData && !metaData) {
      setBriefingLoading(false);
      return;
    }

    async function generateBriefing() {
      setBriefingLoading(true);
      setBriefingError(null);

      try {
        const shopifyKpis = shopifyData?.kpis;
        const metaKpis = metaData?.kpis;

        const metricsPayload = {
          netRevenue: shopifyKpis?.netRevenue?.value ?? 0,
          adSpend: metaKpis?.spend ?? 0,
          blendedROAS: metaKpis?.roas ?? 0,
          orders: shopifyKpis?.orders?.value ?? 0,
          aov: shopifyKpis?.aov?.value ?? 0,
          contributionMargin:
            (shopifyKpis?.netRevenue?.value ?? 0) - (metaKpis?.spend ?? 0),
          cmPct:
            shopifyKpis?.netRevenue?.value && metaKpis?.spend
              ? (((shopifyKpis.netRevenue.value - metaKpis.spend) /
                  shopifyKpis.netRevenue.value) *
                  100)
              : 0,
          topChannel: "Meta",
          topChannelROAS: metaKpis?.roas ?? 0,
          metaSpend: metaKpis?.spend ?? 0,
          metaRevenue: metaKpis?.revenue ?? 0,
          metaROAS: metaKpis?.roas ?? 0,
          newCustomerPct: shopifyKpis?.newCustomerPct?.value ?? 0,
          refundRate: shopifyKpis?.refundRate?.value ?? 0,
        };

        const briefingRes = await fetch("/api/ai/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metricsPayload),
        });

        if (briefingRes.ok) {
          const data = await briefingRes.json();
          if (data.error) {
            setBriefingError(data.error);
          } else {
            setBriefing(data);
          }
        } else {
          setBriefingError("AI briefing service unavailable.");
        }
      } catch (err) {
        console.error("Briefing generation error:", err);
        setBriefingError("Failed to generate AI briefing.");
      } finally {
        setBriefingLoading(false);
      }
    }

    generateBriefing();
  }, [loading, shopifyData, metaData]);

  const filteredAlerts =
    severityFilter === "All"
      ? alerts
      : alerts.filter(
          (a) => a.severity === severityFilter.toLowerCase()
        );

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

      {/* ── Global Error ── */}
      {error && (
        <div className="rounded-lg border border-negative/30 bg-negative/5 p-4">
          <p className="text-sm text-negative">{error}</p>
        </div>
      )}

      {/* ── AI Briefing ── */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Today&apos;s Briefing
        </h3>

        {briefingLoading ? (
          <BriefingSkeleton />
        ) : briefingError ? (
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">&#x1F4CA;</span>
              <span className="text-sm font-semibold">AI Briefing Unavailable</span>
            </div>
            <p className="text-xs text-zinc-500">{briefingError}</p>
          </div>
        ) : briefing ? (
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">&#x1F4CA;</span>
                <span className="text-sm font-semibold">Daily Performance Briefing</span>
              </div>
              <span className="text-xs text-muted">{todayStr}</span>
            </div>

            <p className="text-sm leading-relaxed text-zinc-300">
              {briefing.summary}
            </p>

            {briefing.highlights.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {briefing.highlights.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-sm text-zinc-500">
              No data available to generate a briefing.
            </p>
          </div>
        )}
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
          {loading ? (
            <>
              <AlertSkeleton />
              <AlertSkeleton />
              <AlertSkeleton />
            </>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} {...alert} />
            ))
          ) : alerts.length === 0 && !error ? (
            <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-zinc-500">
              All clear — no alerts triggered from current data.
            </div>
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
