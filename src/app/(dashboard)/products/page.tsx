"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useDashboard } from "@/lib/dashboard-context";
import clsx from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ChannelBreakdown {
  channel: string;
  revenue: number;
  units: number;
  orders: number;
  pct: number;
}

interface Product {
  productId: number;
  name: string;
  sku: string;
  revenue: number;
  units: number;
  orders: number;
  aov: number;
  refundedUnits: number;
  refundAmount: number;
  returnRate: number;
  uniqueCustomers: number;
  channels: ChannelBreakdown[];
  inventory: number;
  dailySellRate: number;
  daysOfStock: number | null;
}

interface ChannelSummary {
  channel: string;
  revenue: number;
  units: number;
  orders: number;
  pct: number;
}

const CHANNEL_COLORS: Record<string, string> = {
  "Meta Ads": "#1877F2",
  "Meta Organic": "#E4405F",
  "Google Ads": "#4285F4",
  "Google Organic": "#34A853",
  Email: "#F59E0B",
  Direct: "#8B5CF6",
  TikTok: "#000000",
  Search: "#06B6D4",
  Other: "#71717A",
};

export default function ProductsPage() {
  const { startISO, endISO, refreshKey, days } = useDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [channelSummary, setChannelSummary] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    async function fetchProducts() {
      try {
        const res = await fetch(
          `/api/products?start=${startISO}&end=${endISO}`
        );
        if (!res.ok)
          throw new Error(`Failed to fetch products (${res.status})`);
        const data = await res.json();
        setProducts(data.products);
        setChannelSummary(data.channelSummary ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [startISO, endISO, refreshKey]);

  const toggleProduct = (id: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = products.reduce((s, p) => s + p.units, 0);
  const totalRefunds = products.reduce((s, p) => s + p.refundAmount, 0);
  const avgReturnRate =
    totalUnits > 0
      ? products.reduce((s, p) => s + p.refundedUnits, 0) / totalUnits * 100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Product Analytics
        </h1>
        <p className="text-xs text-muted mt-1">
          Per-product KPIs, return rates, and channel attribution —{" "}
          {days === 1 ? "Today" : `Last ${days} days`}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded bg-zinc-800/60"
            />
          ))}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Total Revenue
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {products.length} products
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Total Units
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
                {totalUnits.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {products.reduce((s, p) => s + p.uniqueCustomers, 0)} unique
                customers
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Avg Return Rate
              </p>
              <p
                className={clsx(
                  "mt-1 font-mono text-xl font-semibold",
                  avgReturnRate > 10
                    ? "text-red-400"
                    : avgReturnRate > 5
                      ? "text-amber-400"
                      : "text-emerald-400"
                )}
              >
                {formatPercent(avgReturnRate)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {formatCurrency(totalRefunds)} refunded
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Top Channel
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
                {channelSummary[0]?.channel ?? "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {channelSummary[0]
                  ? `${formatPercent(channelSummary[0].pct)} of revenue`
                  : "No data"}
              </p>
            </div>
          </div>

          {/* ── Channel Attribution Summary ── */}
          {channelSummary.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-medium text-zinc-400">
                Revenue by Channel
              </h3>
              {/* Stacked bar */}
              <div className="flex h-4 w-full overflow-hidden rounded-full mb-3">
                {channelSummary.map((ch) => (
                  <div
                    key={ch.channel}
                    style={{
                      width: `${ch.pct}%`,
                      backgroundColor:
                        CHANNEL_COLORS[ch.channel] ?? "#71717A",
                    }}
                    title={`${ch.channel}: ${formatPercent(ch.pct)}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-400">
                {channelSummary.map((ch) => (
                  <span key={ch.channel} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          CHANNEL_COLORS[ch.channel] ?? "#71717A",
                      }}
                    />
                    {ch.channel}{" "}
                    <span className="font-mono">
                      {formatPercent(ch.pct)}
                    </span>{" "}
                    &middot;{" "}
                    <span className="font-mono">
                      {formatCurrency(ch.revenue)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Product Performance Table ── */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-medium text-zinc-400">
              Product Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    <th colSpan={2}></th>
                    <th
                      colSpan={3}
                      className="px-3 pt-2 pb-1 text-center border-l border-border/40"
                    >
                      <span className="text-emerald-500/60">Sales</span>
                    </th>
                    <th
                      colSpan={2}
                      className="px-3 pt-2 pb-1 text-center border-l border-border/40"
                    >
                      <span className="text-red-400/60">Returns</span>
                    </th>
                    <th
                      colSpan={2}
                      className="px-3 pt-2 pb-1 text-center border-l border-border/40"
                    >
                      <span className="text-zinc-500">Inventory</span>
                    </th>
                    <th className="px-3 pt-2 pb-1 text-center border-l border-border/40">
                      <span className="text-[#1877F2]/60">Attribution</span>
                    </th>
                  </tr>
                  <tr className="border-b border-border text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    <th className="pl-3 pr-1 py-2 w-[24px]"></th>
                    <th className="px-3 py-2">Product</th>
                    <th className="pl-4 pr-3 py-2 text-right border-l border-border/40">
                      Revenue
                    </th>
                    <th className="px-3 py-2 text-right">Units</th>
                    <th className="px-3 py-2 text-right">AOV</th>
                    <th className="pl-4 pr-3 py-2 text-right border-l border-border/40">
                      Return Rate
                    </th>
                    <th className="px-3 py-2 text-right">Refunded</th>
                    <th className="pl-4 pr-3 py-2 text-right border-l border-border/40">
                      Stock
                    </th>
                    <th className="px-3 py-2 text-right">Days Left</th>
                    <th className="pl-4 pr-3 py-2 border-l border-border/40">
                      Top Channel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isExpanded = expandedProducts.has(p.productId);
                    const isLowStock =
                      p.daysOfStock !== null && p.daysOfStock < 14;
                    const topChannel = p.channels[0];

                    return (
                      <>
                        <tr
                          key={`p-${p.productId}`}
                          className="border-b border-border/50 cursor-pointer transition-colors hover:bg-white/[0.02]"
                          onClick={() => toggleProduct(p.productId)}
                        >
                          <td className="pl-3 pr-1 py-3 text-zinc-500">
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <span className="font-medium text-zinc-200 text-[13px]">
                                {p.name}
                              </span>
                              {p.sku && (
                                <span className="ml-2 text-[10px] text-zinc-600 font-mono">
                                  {p.sku}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              {p.uniqueCustomers} customer
                              {p.uniqueCustomers !== 1 ? "s" : ""}
                            </div>
                          </td>
                          <td className="pl-4 pr-3 py-3 text-right border-l border-border/40">
                            <div className="font-mono font-semibold text-[13px]">
                              {formatCurrency(p.revenue)}
                            </div>
                            {totalRevenue > 0 && (
                              <div className="mt-1 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500/60"
                                  style={{
                                    width: `${(p.revenue / totalRevenue) * 100}%`,
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-mono">
                            {p.units.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono">
                            {formatCurrency(p.aov, 2)}
                          </td>
                          <td className="pl-4 pr-3 py-3 text-right border-l border-border/40">
                            <span
                              className={clsx(
                                "font-mono font-medium",
                                p.returnRate > 10
                                  ? "text-red-400"
                                  : p.returnRate > 5
                                    ? "text-amber-400"
                                    : p.returnRate > 0
                                      ? "text-zinc-300"
                                      : "text-zinc-500"
                              )}
                            >
                              {formatPercent(p.returnRate)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-zinc-400">
                            {p.refundedUnits > 0 ? (
                              <span>
                                {p.refundedUnits}u &middot;{" "}
                                {formatCurrency(p.refundAmount)}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="pl-4 pr-3 py-3 text-right font-mono border-l border-border/40">
                            {p.inventory.toLocaleString()}
                          </td>
                          <td
                            className={clsx(
                              "px-3 py-3 text-right font-mono",
                              isLowStock
                                ? "text-amber-400 font-semibold"
                                : ""
                            )}
                          >
                            {p.daysOfStock == null
                              ? "—"
                              : `${p.daysOfStock}d`}
                          </td>
                          <td className="pl-4 pr-3 py-3 border-l border-border/40">
                            {topChannel ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      CHANNEL_COLORS[topChannel.channel] ??
                                      "#71717A",
                                  }}
                                />
                                <span className="text-xs text-zinc-300">
                                  {topChannel.channel}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {formatPercent(topChannel.pct)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-600 text-xs">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Channel Breakdown */}
                        {isExpanded && (
                          <tr
                            key={`detail-${p.productId}`}
                            className="border-b border-border/30 bg-zinc-900/40"
                          >
                            <td colSpan={10} className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Channel Breakdown Table */}
                                <div>
                                  <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                                    Channel Breakdown
                                  </h4>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border/50 text-zinc-500 uppercase tracking-wider">
                                        <th className="py-1.5 text-left">
                                          Channel
                                        </th>
                                        <th className="py-1.5 text-right">
                                          Revenue
                                        </th>
                                        <th className="py-1.5 text-right">
                                          Units
                                        </th>
                                        <th className="py-1.5 text-right">
                                          Share
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {p.channels.map((ch) => (
                                        <tr
                                          key={ch.channel}
                                          className="border-b border-border/20"
                                        >
                                          <td className="py-1.5">
                                            <span className="flex items-center gap-1.5">
                                              <span
                                                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                                                style={{
                                                  backgroundColor:
                                                    CHANNEL_COLORS[
                                                      ch.channel
                                                    ] ?? "#71717A",
                                                }}
                                              />
                                              <span className="text-zinc-300">
                                                {ch.channel}
                                              </span>
                                            </span>
                                          </td>
                                          <td className="py-1.5 text-right font-mono text-zinc-300">
                                            {formatCurrency(ch.revenue)}
                                          </td>
                                          <td className="py-1.5 text-right font-mono text-zinc-400">
                                            {ch.units}
                                          </td>
                                          <td className="py-1.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                                <div
                                                  className="h-full rounded-full"
                                                  style={{
                                                    width: `${ch.pct}%`,
                                                    backgroundColor:
                                                      CHANNEL_COLORS[
                                                        ch.channel
                                                      ] ?? "#71717A",
                                                  }}
                                                />
                                              </div>
                                              <span className="font-mono text-zinc-400 w-10 text-right">
                                                {formatPercent(ch.pct)}
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Product Stats */}
                                <div>
                                  <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                                    Product Stats
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded border border-border/50 bg-[#0A0A0B] p-2.5">
                                      <p className="text-[10px] text-zinc-500">
                                        Revenue / Customer
                                      </p>
                                      <p className="font-mono text-sm font-medium text-zinc-200">
                                        {formatCurrency(
                                          p.uniqueCustomers > 0
                                            ? p.revenue / p.uniqueCustomers
                                            : 0,
                                          2
                                        )}
                                      </p>
                                    </div>
                                    <div className="rounded border border-border/50 bg-[#0A0A0B] p-2.5">
                                      <p className="text-[10px] text-zinc-500">
                                        Units / Customer
                                      </p>
                                      <p className="font-mono text-sm font-medium text-zinc-200">
                                        {p.uniqueCustomers > 0
                                          ? (
                                              p.units / p.uniqueCustomers
                                            ).toFixed(1)
                                          : "—"}
                                      </p>
                                    </div>
                                    <div className="rounded border border-border/50 bg-[#0A0A0B] p-2.5">
                                      <p className="text-[10px] text-zinc-500">
                                        Sell Rate
                                      </p>
                                      <p className="font-mono text-sm font-medium text-zinc-200">
                                        {p.dailySellRate.toFixed(1)}/day
                                      </p>
                                    </div>
                                    <div className="rounded border border-border/50 bg-[#0A0A0B] p-2.5">
                                      <p className="text-[10px] text-zinc-500">
                                        Net Revenue
                                      </p>
                                      <p className="font-mono text-sm font-medium text-zinc-200">
                                        {formatCurrency(
                                          p.revenue - p.refundAmount
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-0.5 rounded bg-amber-500" />
                Stock &lt; 14 days
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                Return rate &gt; 10%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                Return rate 5-10%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
