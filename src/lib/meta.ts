// Meta Marketing API client — Graph API v21.0
// Docs: https://developers.facebook.com/docs/marketing-api

const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID!;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;

const API_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

async function metaFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("access_token", ACCESS_TOKEN);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
    throw new Error(`Meta API ${res.status}: ${msg}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  impressions: string;
  reach: string;
  spend: string;
  clicks: string;
  cpc: string;
  cpm: string;
  ctr: string;
  frequency: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
  video_p25_watched_actions?: { action_type: string; value: string }[];
  video_p50_watched_actions?: { action_type: string; value: string }[];
  video_p75_watched_actions?: { action_type: string; value: string }[];
  video_p100_watched_actions?: { action_type: string; value: string }[];
  video_thruplay_watched_actions?: { action_type: string; value: string }[];
}

export interface MetaCampaignRaw {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  buying_type: string;
  insights?: { data: MetaInsight[] };
}

export interface MetaAdSetRaw {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  targeting?: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: { countries?: string[] };
    custom_audiences?: { id: string; name: string }[];
    flexible_spec?: { interests?: { id: string; name: string }[] }[];
  };
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal: string;
  insights?: { data: MetaInsight[] };
}

export interface MetaAdRaw {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  creative?: {
    id: string;
    title?: string;
    body?: string;
    thumbnail_url?: string;
  };
  insights?: { data: MetaInsight[] };
}

// ── Helpers ──

function extractAction(insight: MetaInsight, actionType: string): number {
  const action = insight.actions?.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

function extractActionValue(insight: MetaInsight, actionType: string): number {
  const action = insight.action_values?.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

function extractCostPerAction(insight: MetaInsight, actionType: string): number {
  const action = insight.cost_per_action_type?.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

// ── API Methods ──

const INSIGHT_FIELDS = [
  "impressions",
  "reach",
  "spend",
  "clicks",
  "cpc",
  "cpm",
  "ctr",
  "frequency",
  "actions",
  "action_values",
  "cost_per_action_type",
  "video_thruplay_watched_actions",
].join(",");

export async function getAccountInsights(params?: {
  date_preset?: string;
  time_range?: { since: string; until: string };
  time_increment?: string;
}): Promise<MetaInsight[]> {
  const queryParams: Record<string, string> = {
    fields: INSIGHT_FIELDS,
    level: "account",
  };

  if (params?.time_range) {
    queryParams.time_range = JSON.stringify(params.time_range);
  } else {
    queryParams.date_preset = params?.date_preset ?? "last_7d";
  }

  if (params?.time_increment) {
    queryParams.time_increment = params.time_increment;
  }

  const data = await metaFetch<{ data: MetaInsight[] }>(
    `/${AD_ACCOUNT_ID}/insights`,
    queryParams
  );
  return data.data;
}

export async function getCampaigns(params?: {
  date_preset?: string;
  time_range?: { since: string; until: string };
}): Promise<MetaCampaignRaw[]> {
  const insightParams: Record<string, string> = {
    fields: INSIGHT_FIELDS,
  };
  if (params?.time_range) {
    insightParams.time_range = JSON.stringify(params.time_range);
  } else {
    insightParams.date_preset = params?.date_preset ?? "last_7d";
  }

  const queryParams: Record<string, string> = {
    fields: `id,name,status,objective,daily_budget,lifetime_budget,buying_type,insights.fields(${INSIGHT_FIELDS})${params?.time_range ? `.time_range(${JSON.stringify(params.time_range)})` : ".date_preset(last_7d)"}`,
    limit: "100",
  };

  const data = await metaFetch<{ data: MetaCampaignRaw[] }>(
    `/${AD_ACCOUNT_ID}/campaigns`,
    queryParams
  );
  return data.data;
}

export async function getAdSets(params?: {
  campaignId?: string;
  date_preset?: string;
}): Promise<MetaAdSetRaw[]> {
  const endpoint = params?.campaignId
    ? `/${params.campaignId}/adsets`
    : `/${AD_ACCOUNT_ID}/adsets`;

  const queryParams: Record<string, string> = {
    fields: `id,name,campaign_id,status,targeting,daily_budget,lifetime_budget,optimization_goal,insights.fields(${INSIGHT_FIELDS}).date_preset(${params?.date_preset ?? "last_7d"})`,
    limit: "200",
  };

  const data = await metaFetch<{ data: MetaAdSetRaw[] }>(endpoint, queryParams);
  return data.data;
}

export async function getAds(params?: {
  adSetId?: string;
  date_preset?: string;
}): Promise<MetaAdRaw[]> {
  const endpoint = params?.adSetId
    ? `/${params.adSetId}/ads`
    : `/${AD_ACCOUNT_ID}/ads`;

  const queryParams: Record<string, string> = {
    fields: `id,name,adset_id,campaign_id,status,creative{id,title,body,thumbnail_url},insights.fields(${INSIGHT_FIELDS}).date_preset(${params?.date_preset ?? "last_7d"})`,
    limit: "200",
  };

  const data = await metaFetch<{ data: MetaAdRaw[] }>(endpoint, queryParams);
  return data.data;
}

// ── Computed Metrics ──

export function computeInsightMetrics(insight: MetaInsight) {
  const spend = parseFloat(insight.spend);
  const impressions = parseInt(insight.impressions);
  const reach = parseInt(insight.reach);
  const clicks = parseInt(insight.clicks);
  const purchases = extractAction(insight, "purchase");
  const revenue = extractActionValue(insight, "purchase");
  const cpa = extractCostPerAction(insight, "purchase");
  const roas = spend > 0 ? revenue / spend : 0;
  const frequency = parseFloat(insight.frequency);
  const ctr = parseFloat(insight.ctr);
  const cpc = parseFloat(insight.cpc);
  const cpm = parseFloat(insight.cpm);
  const reachCPM = reach > 0 ? (spend / reach) * 1000 : 0;

  return {
    spend,
    impressions,
    reach,
    clicks,
    purchases,
    revenue,
    roas,
    cpa,
    frequency,
    ctr,
    cpc,
    cpm,
    reachCPM,
    date_start: insight.date_start,
    date_stop: insight.date_stop,
  };
}
