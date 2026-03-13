"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/format";
import { useDashboard } from "@/lib/dashboard-context";

interface Product {
  productId: number;
  name: string;
  sku: string;
  revenue: number;
  units: number;
  aov: number;
  inventory: number;
  dailySellRate: number;
  daysOfStock: number;
}

export default function ProductsPage() {
  const { startISO, endISO, refreshKey } = useDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/products?start=${startISO}&end=${endISO}`);
        if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
        const data = await res.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [startISO, endISO, refreshKey]);

  // Compute AOV top quartile threshold for emerald indicator
  const aovThreshold = (() => {
    if (products.length === 0) return Infinity;
    const sorted = [...products].map((p) => p.aov).sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.75);
    return sorted[idx] ?? Infinity;
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-100">
        Products &mdash; Performance
      </h1>

      <div className="rounded-lg border border-border bg-surface p-5">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4">SKU</th>
                    <th className="pb-3 pr-4 text-right">Revenue</th>
                    <th className="pb-3 pr-4 text-right">Units</th>
                    <th className="pb-3 pr-4 text-right">AOV</th>
                    <th className="pb-3 pr-4 text-right">Inventory</th>
                    <th className="pb-3 text-right">Days of Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLowStock = p.daysOfStock < 14;
                    const isHighAov = p.aov >= aovThreshold;

                    let borderClass = "";
                    if (isLowStock) borderClass = "border-l-2 border-l-amber-500";
                    else if (isHighAov)
                      borderClass = "border-l-2 border-l-emerald-500";

                    return (
                      <tr
                        key={p.productId}
                        className={`data-row border-b border-border/50 transition-colors ${borderClass}`}
                      >
                        <td className="py-3 pr-4 font-medium text-zinc-200">
                          {p.name}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted">
                          {p.sku}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">
                          {p.units.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 pr-4 text-right font-mono ${
                            isHighAov ? "text-emerald-400" : ""
                          }`}
                        >
                          {formatCurrency(p.aov, 2)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">
                          {p.inventory.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 text-right font-mono ${
                            isLowStock ? "text-amber-400 font-semibold" : ""
                          }`}
                        >
                          {p.daysOfStock === Infinity || p.daysOfStock == null
                            ? "--"
                            : `${p.daysOfStock}d`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-0.5 rounded bg-amber-500" />
                Days of stock &lt; 14
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-0.5 rounded bg-emerald-500" />
                Top quartile AOV
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
