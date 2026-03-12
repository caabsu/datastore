"use client";

import { productsCrossChannel } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-100">
        Products &mdash; Cross-Channel Performance
      </h1>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">SKU</th>
                <th className="pb-3 pr-4 text-right">Revenue</th>
                <th className="pb-3 pr-4 text-right">Units</th>
                <th className="pb-3 pr-4 text-right">Meta Spend</th>
                <th className="pb-3 pr-4 text-right">Google Spend</th>
                <th className="pb-3 pr-4 text-right">Meta ROAS</th>
                <th className="pb-3 pr-4 text-right">Google ROAS</th>
                <th className="pb-3 pr-4 text-right">CM</th>
                <th className="pb-3 pr-4 text-right">CM %</th>
                <th className="pb-3 pr-4 text-right">Inventory</th>
                <th className="pb-3 text-right">Days of Stock</th>
              </tr>
            </thead>
            <tbody>
              {productsCrossChannel.map((p) => {
                const daysOfStock =
                  p.dailySellRate > 0
                    ? Math.round(p.inventory / p.dailySellRate)
                    : Infinity;
                const isLowStock = daysOfStock < 14;
                const isHighMargin = p.cmPct > 40;

                let borderClass = "";
                if (isLowStock) borderClass = "border-l-2 border-l-amber-500";
                else if (isHighMargin)
                  borderClass = "border-l-2 border-l-emerald-500";

                return (
                  <tr
                    key={p.sku}
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
                    <td className="py-3 pr-4 text-right font-mono">
                      {formatCurrency(p.metaSpend)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {formatCurrency(p.googleSpend)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {p.metaROAS.toFixed(1)}x
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {p.googleROAS.toFixed(1)}x
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {formatCurrency(p.cm)}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-mono ${
                        p.cmPct > 40 ? "text-emerald-400" : ""
                      }`}
                    >
                      {formatPercent(p.cmPct)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {p.inventory.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 text-right font-mono ${
                        isLowStock ? "text-amber-400 font-semibold" : ""
                      }`}
                    >
                      {daysOfStock === Infinity ? "--" : `${daysOfStock}d`}
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
            CM % &gt; 40%
          </span>
        </div>
      </div>
    </div>
  );
}
