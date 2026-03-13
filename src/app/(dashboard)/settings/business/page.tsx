"use client";

import { useState } from "react";

// Default business config — these are the same defaults used in /api/profitability
const DEFAULT_CONFIG = {
  defaultCogsPct: 35,
  avgShippingCost: 5.5,
  avgPackagingCost: 1.25,
  processingFeePct: 2.9,
  perTransactionFee: 0.3,
  includeTaxInRevenue: false,
  includeShippingInRevenue: false,
  targetBlendedROAS: 3.0,
  targetNewCustomerCAC: 45.0,
  targetContributionMarginPct: 25,
};

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
  onChange,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label className="text-sm text-zinc-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        className="w-48 rounded border border-border bg-[#0A0A0B] px-3 py-1.5 text-right font-mono text-sm text-zinc-200 outline-none focus:border-accent"
      />
    </div>
  );
}

function ToggleDisplay({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-emerald-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function BusinessConfigPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof typeof DEFAULT_CONFIG>(
    key: K,
    value: (typeof DEFAULT_CONFIG)[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // In the future this would POST to an API / database
    // For now just show a confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Business Configuration
        </h1>
        <p className="mt-1 text-sm text-muted">
          These settings define how Datastore calculates profitability.
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Changes are local to this session. Persistence requires database
          integration.
        </p>
      </div>

      {/* Cost of Goods */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Cost of Goods</SectionHeading>
        <FieldRow
          label="Default COGS %"
          value={`${config.defaultCogsPct}%`}
          onChange={(v) => {
            const n = parseFloat(v.replace("%", ""));
            if (!isNaN(n)) update("defaultCogsPct", n);
          }}
        />
      </div>

      {/* Fulfillment Costs */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Fulfillment Costs</SectionHeading>
        <FieldRow
          label="Avg Shipping Cost"
          value={`$${config.avgShippingCost.toFixed(2)}`}
          onChange={(v) => {
            const n = parseFloat(v.replace("$", ""));
            if (!isNaN(n)) update("avgShippingCost", n);
          }}
        />
        <FieldRow
          label="Avg Packaging Cost"
          value={`$${config.avgPackagingCost.toFixed(2)}`}
          onChange={(v) => {
            const n = parseFloat(v.replace("$", ""));
            if (!isNaN(n)) update("avgPackagingCost", n);
          }}
        />
      </div>

      {/* Payment Processing */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Payment Processing</SectionHeading>
        <FieldRow
          label="Processing Fee %"
          value={`${config.processingFeePct}%`}
          onChange={(v) => {
            const n = parseFloat(v.replace("%", ""));
            if (!isNaN(n)) update("processingFeePct", n);
          }}
        />
        <FieldRow
          label="Per-Transaction Fee"
          value={`$${config.perTransactionFee.toFixed(2)}`}
          onChange={(v) => {
            const n = parseFloat(v.replace("$", ""));
            if (!isNaN(n)) update("perTransactionFee", n);
          }}
        />
      </div>

      {/* Revenue Recognition */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Revenue Recognition</SectionHeading>
        <ToggleDisplay
          label="Include tax in revenue?"
          enabled={config.includeTaxInRevenue}
          onToggle={() =>
            update("includeTaxInRevenue", !config.includeTaxInRevenue)
          }
        />
        <ToggleDisplay
          label="Include shipping in revenue?"
          enabled={config.includeShippingInRevenue}
          onToggle={() =>
            update(
              "includeShippingInRevenue",
              !config.includeShippingInRevenue
            )
          }
        />
      </div>

      {/* Targets */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionHeading>Targets</SectionHeading>
        <FieldRow
          label="Target Blended ROAS"
          value={`${config.targetBlendedROAS.toFixed(1)}x`}
          onChange={(v) => {
            const n = parseFloat(v.replace("x", ""));
            if (!isNaN(n)) update("targetBlendedROAS", n);
          }}
        />
        <FieldRow
          label="Target New Customer CAC"
          value={`$${config.targetNewCustomerCAC.toFixed(2)}`}
          onChange={(v) => {
            const n = parseFloat(v.replace("$", ""));
            if (!isNaN(n)) update("targetNewCustomerCAC", n);
          }}
        />
        <FieldRow
          label="Target Contribution Margin %"
          value={`${config.targetContributionMarginPct}%`}
          onChange={(v) => {
            const n = parseFloat(v.replace("%", ""));
            if (!isNaN(n)) update("targetContributionMarginPct", n);
          }}
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-emerald-400">Settings saved</span>
        )}
        <button
          onClick={handleSave}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
