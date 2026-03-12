"use client";

import { businessConfig } from "@/lib/mock-data";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">
      {children}
    </h3>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label className="text-sm text-zinc-400">{label}</label>
      <input
        type="text"
        readOnly
        value={value}
        className="w-48 rounded border border-border bg-[#0A0A0B] px-3 py-1.5 text-right font-mono text-sm text-zinc-200 outline-none"
      />
    </div>
  );
}

function ToggleDisplay({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-emerald-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}

export default function BusinessConfigPage() {
  const cfg = businessConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Business Configuration
        </h1>
        <p className="mt-1 text-sm text-muted">
          These settings define how Datastore calculates profitability.
        </p>
      </div>

      {/* Cost of Goods */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Cost of Goods</SectionHeading>
        <FieldRow label="Default COGS %" value={`${cfg.defaultCogsPct}%`} />

        {/* Product-Level Overrides */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Product-Level Overrides
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">Product</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4 text-right">Value</th>
                <th className="pb-2 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {cfg.productOverrides.map((o) => (
                <tr
                  key={o.product}
                  className="data-row border-b border-border/50 transition-colors"
                >
                  <td className="py-2.5 pr-4 text-zinc-200">{o.product}</td>
                  <td className="py-2.5 pr-4 text-muted">{o.method}</td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {o.value}
                  </td>
                  <td className="py-2.5 text-right text-muted">{o.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment Costs */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Fulfillment Costs</SectionHeading>
        <FieldRow
          label="Avg Shipping Cost"
          value={`$${cfg.avgShippingCost.toFixed(2)}`}
        />
        <FieldRow
          label="Avg Packaging Cost"
          value={`$${cfg.avgPackagingCost.toFixed(2)}`}
        />
      </div>

      {/* Payment Processing */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Payment Processing</SectionHeading>
        <FieldRow
          label="Processing Fee %"
          value={`${cfg.processingFeePct}%`}
        />
        <FieldRow
          label="Per-Transaction Fee"
          value={`$${cfg.perTransactionFee.toFixed(2)}`}
        />
      </div>

      {/* Revenue Recognition */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Revenue Recognition</SectionHeading>
        <ToggleDisplay
          label="Include tax in revenue?"
          enabled={cfg.includeTaxInRevenue}
        />
        <ToggleDisplay
          label="Include shipping in revenue?"
          enabled={cfg.includeShippingInRevenue}
        />
      </div>

      {/* Targets */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Targets</SectionHeading>
        <FieldRow
          label="Target Blended ROAS"
          value={`${cfg.targetBlendedROAS.toFixed(1)}x`}
        />
        <FieldRow
          label="Target New Customer CAC"
          value={`$${cfg.targetNewCustomerCAC.toFixed(2)}`}
        />
        <FieldRow
          label="Target Contribution Margin %"
          value={`${cfg.targetContributionMarginPct}%`}
        />
      </div>

      {/* Change Log */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Change Log</SectionHeading>
        <div className="space-y-0">
          {cfg.changeLog.map((entry, i) => (
            <div
              key={i}
              className="relative flex gap-4 border-l-2 border-border py-4 pl-6"
            >
              {/* Timeline dot */}
              <span className="absolute -left-[5px] top-5 h-2 w-2 rounded-full bg-accent" />

              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{entry.date}</span>
                  <span>&middot;</span>
                  <span>{entry.author}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-200">
                  <span className="font-medium">{entry.field}</span>:{" "}
                  <span className="font-mono text-red-400 line-through">
                    {entry.old}
                  </span>{" "}
                  &rarr;{" "}
                  <span className="font-mono text-emerald-400">
                    {entry.new}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted">{entry.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600">
          Save Changes
        </button>
      </div>
    </div>
  );
}
