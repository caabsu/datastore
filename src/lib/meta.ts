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
  video_play_actions?: { action_type: string; value: string }[];
  // Age breakdown field (present when breakdowns=age is used)
  age?: string;
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

/** Try multiple action_type strings, return the first match */
function extractActionMulti(insight: MetaInsight, actionTypes: string[]): number {
  if (!insight.actions) return 0;
  for (const t of actionTypes) {
    const action = insight.actions.find((a) => a.action_type === t);
    if (action) return parseFloat(action.value);
  }
  return 0;
}

function extractActionValue(insight: MetaInsight, actionType: string): number {
  const action = insight.action_values?.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

/** Try multiple action_type strings for action_values */
function extractActionValueMulti(insight: MetaInsight, actionTypes: string[]): number {
  if (!insight.action_values) return 0;
  for (const t of actionTypes) {
    const action = insight.action_values.find((a) => a.action_type === t);
    if (action) return parseFloat(action.value);
  }
  return 0;
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
  "video_play_actions",
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
  time_range?: { since: string; until: string };
}): Promise<MetaAdSetRaw[]> {
  const endpoint = params?.campaignId
    ? `/${params.campaignId}/adsets`
    : `/${AD_ACCOUNT_ID}/adsets`;

  const insightDateClause = params?.time_range
    ? `.time_range(${JSON.stringify(params.time_range)})`
    : `.date_preset(${params?.date_preset ?? "last_7d"})`;

  const queryParams: Record<string, string> = {
    fields: `id,name,campaign_id,status,targeting,daily_budget,lifetime_budget,optimization_goal,insights.fields(${INSIGHT_FIELDS})${insightDateClause}`,
    limit: "200",
  };

  const data = await metaFetch<{ data: MetaAdSetRaw[] }>(endpoint, queryParams);
  return data.data;
}

export async function getAds(params?: {
  adSetId?: string;
  date_preset?: string;
  time_range?: { since: string; until: string };
}): Promise<MetaAdRaw[]> {
  const endpoint = params?.adSetId
    ? `/${params.adSetId}/ads`
    : `/${AD_ACCOUNT_ID}/ads`;

  const insightDateClause = params?.time_range
    ? `.time_range(${JSON.stringify(params.time_range)})`
    : `.date_preset(${params?.date_preset ?? "last_7d"})`;

  const queryParams: Record<string, string> = {
    fields: `id,name,adset_id,campaign_id,status,creative{id,title,body,thumbnail_url},insights.fields(${INSIGHT_FIELDS})${insightDateClause}`,
    limit: "500",
  };

  // First page
  const firstPage = await metaFetch<{ data: MetaAdRaw[]; paging?: { next?: string } }>(endpoint, queryParams);
  const allAds: MetaAdRaw[] = [...firstPage.data];

  // Follow pagination cursors (max 10 pages to avoid runaway)
  let nextUrl = firstPage.paging?.next ?? null;
  for (let page = 1; page < 10 && nextUrl; page++) {
    const res = await fetch(nextUrl, { cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json() as { data: MetaAdRaw[]; paging?: { next?: string } };
    if (!data.data?.length) break;
    allAds.push(...data.data);
    nextUrl = data.paging?.next ?? null;
  }

  return allAds;
}

/** Lightweight ads fetch for creative breakdown — only fetches name + spend/revenue/purchases */
const LIGHT_INSIGHT_FIELDS = "spend,actions,action_values";

export async function getAdsLightweight(params?: {
  date_preset?: string;
  time_range?: { since: string; until: string };
}): Promise<{ name: string; spend: number; revenue: number; purchases: number }[]> {
  const insightDateClause = params?.time_range
    ? `.time_range(${JSON.stringify(params.time_range)})`
    : `.date_preset(${params?.date_preset ?? "last_7d"})`;

  const queryParams: Record<string, string> = {
    fields: `name,insights.fields(${LIGHT_INSIGHT_FIELDS})${insightDateClause}`,
    limit: "500",
  };

  type LightAd = {
    name: string;
    insights?: { data: Array<{ spend: string; actions?: { action_type: string; value: string }[]; action_values?: { action_type: string; value: string }[] }> };
  };
  type LightPage = { data: LightAd[]; paging?: { next?: string } };

  const firstPage = await metaFetch<LightPage>(`/${AD_ACCOUNT_ID}/ads`, queryParams);
  const allAds: LightAd[] = [...firstPage.data];

  let nextUrl = firstPage.paging?.next ?? null;
  for (let page = 1; page < 10 && nextUrl; page++) {
    const res = await fetch(nextUrl, { cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json() as LightPage;
    if (!data.data?.length) break;
    allAds.push(...data.data);
    nextUrl = data.paging?.next ?? null;
  }

  return allAds.map((ad) => {
    const insight = ad.insights?.data?.[0];
    const spend = insight ? parseFloat(insight.spend) : 0;
    const purchases = insight?.actions?.find(
      (a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    const revenue = insight?.action_values?.find(
      (a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    return {
      name: ad.name ?? "",
      spend,
      revenue: revenue ? parseFloat(revenue.value) : 0,
      purchases: purchases ? parseFloat(purchases.value) : 0,
    };
  });
}

export async function getAccountInsightsWithBreakdown(params?: {
  date_preset?: string;
  time_range?: { since: string; until: string };
  breakdowns?: string;
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

  if (params?.breakdowns) {
    queryParams.breakdowns = params.breakdowns;
  }

  const data = await metaFetch<{ data: MetaInsight[] }>(
    `/${AD_ACCOUNT_ID}/insights`,
    queryParams
  );
  return data.data;
}

// ── Computed Metrics ──

export function computeInsightMetrics(insight: MetaInsight) {
  const spend = parseFloat(insight.spend);
  const impressions = parseInt(insight.impressions);
  const reach = parseInt(insight.reach);
  const clicks = parseInt(insight.clicks);
  const purchases = extractActionMulti(insight, [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
  ]);
  const revenue = extractActionValueMulti(insight, [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
  ]);
  const cpa = extractCostPerAction(insight, "purchase");
  const roas = spend > 0 ? revenue / spend : 0;
  const frequency = parseFloat(insight.frequency);
  const ctr = parseFloat(insight.ctr);
  const cpc = parseFloat(insight.cpc);
  const cpm = parseFloat(insight.cpm);
  const reachCPM = reach > 0 ? (spend / reach) * 1000 : 0;

  // Funnel action metrics
  const linkClicks = extractAction(insight, "link_click");
  const addToCart = extractActionMulti(insight, [
    "offsite_conversion.fb_pixel_add_to_cart",
    "add_to_cart",
  ]);
  const initiateCheckout = extractActionMulti(insight, [
    "offsite_conversion.fb_pixel_initiate_checkout",
    "initiate_checkout",
  ]);

  // Video / engagement metrics
  // Hook rate uses native Meta "3-second video views" from the actions array
  // (NOT video_play_actions which counts 0-second autoplay starts)
  const threeSecViews = extractAction(insight, "video_view");
  const hookRate = impressions > 0 ? (threeSecViews / impressions) * 100 : 0;
  const postEngagement = extractAction(insight, "post_engagement");
  const engagementDepth = reach > 0 ? (postEngagement / reach) * 100 : 0;

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
    linkClicks,
    addToCart,
    initiateCheckout,
    hookRate,
    engagementDepth,
    date_start: insight.date_start,
    date_stop: insight.date_stop,
  };
}
