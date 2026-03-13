"use client";

export default function GoogleAdsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Google Ads Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Performance across Search, Shopping, and Performance Max campaigns
        </p>
      </div>

      {/* Connect prompt */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-surface px-8 py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-zinc-200">
          Connect Google Ads
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-zinc-500 leading-relaxed">
          Google Ads API integration is not yet configured. To enable this page,
          set up a Google Ads API project and add the following environment
          variables:
        </p>
        <div className="mt-4 space-y-1 text-xs font-mono text-zinc-500">
          <p>GOOGLE_ADS_CUSTOMER_ID</p>
          <p>GOOGLE_ADS_DEVELOPER_TOKEN</p>
          <p>GOOGLE_ADS_CLIENT_ID</p>
          <p>GOOGLE_ADS_CLIENT_SECRET</p>
          <p>GOOGLE_ADS_REFRESH_TOKEN</p>
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          Once configured, this page will display KPIs, campaign performance,
          device breakdown, keyword categories, PMax channels, and top search
          terms.
        </p>
      </div>
    </div>
  );
}
