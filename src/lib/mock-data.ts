// ============================================
// MOCK DATA FOR DATASTORE DASHBOARD
// ============================================

import { subDays, format } from 'date-fns';

const today = new Date(2026, 2, 11); // March 11, 2026

function generateDailyData(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(today, days - 1 - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = isWeekend ? 0.75 : 1;
    const noise = 0.85 + Math.random() * 0.3;
    const trend = 1 + i * 0.005;
    return {
      date: format(date, 'MMM dd'),
      dateISO: format(date, 'yyyy-MM-dd'),
      multiplier: base * noise * trend,
    };
  });
}

const daily28 = generateDailyData(28);

// ── UNIFIED OVERVIEW KPIs ──
export const overviewKPIs = {
  netRevenue: { value: 48230, change: 12.4, prior: 42920, sparkline: daily28.map(d => Math.round(38000 * d.multiplier)) },
  adSpend: { value: 12870, change: 8.2, prior: 11895, sparkline: daily28.map(d => Math.round(11000 * d.multiplier * 0.95)) },
  blendedROAS: { value: 3.75, change: 3.8, prior: 3.61, sparkline: daily28.map(d => +(3.2 * d.multiplier * 0.97).toFixed(2)) },
  contributionMargin: { value: 14222, change: 18.1, prior: 12042, pct: 30.5, sparkline: daily28.map(d => Math.round(11000 * d.multiplier)) },
  orders: { value: 312, change: 6.1, prior: 294, sparkline: daily28.map(d => Math.round(280 * d.multiplier * 0.92)) },
  aov: { value: 154.58, change: 5.9, prior: 146.0, sparkline: daily28.map(d => +(140 * d.multiplier * 0.98).toFixed(2)) },
  newCustomerCAC: { value: 38.40, change: 2.1, prior: 37.61, sparkline: daily28.map(d => +(35 * d.multiplier * 1.02).toFixed(2)) },
  newCustomerPct: { value: 42.3, change: -3.2, prior: 43.7, sparkline: daily28.map(d => +(44 * d.multiplier * 0.96).toFixed(1)) },
};

// ── REVENUE vs SPEND CHART DATA ──
export const revenueVsSpendData = daily28.map((d, i) => ({
  date: d.date,
  revenue: Math.round(38000 + Math.sin(i / 3) * 8000 + i * 400 + (Math.random() - 0.5) * 4000),
  spend: Math.round(10500 + Math.sin(i / 4) * 1500 + i * 80 + (Math.random() - 0.5) * 1000),
}));

// ── CHANNEL MIX ──
export const channelMix = [
  { channel: 'meta', label: 'Meta Ads', revenue: 34020, spend: 8420, roas: 4.04, roasChange: 5, orders: 186, color: '#1877F2' },
  { channel: 'google', label: 'Google Ads', revenue: 14030, spend: 4450, roas: 3.15, roasChange: -2, orders: 89, color: '#4285F4' },
  { channel: 'organic', label: 'Organic', revenue: 8690, spend: 0, roas: Infinity, roasChange: 12, orders: 62, color: '#8B5CF6' },
  { channel: 'email', label: 'Email', revenue: 3860, spend: 0, roas: Infinity, roasChange: 8, orders: 28, color: '#F59E0B' },
  { channel: 'direct', label: 'Direct', revenue: 1930, spend: 0, roas: Infinity, roasChange: -1, orders: 14, color: '#6B7280' },
];

export const channelDonutData = channelMix.map(c => ({
  name: c.label,
  value: c.revenue,
  color: c.color,
}));

// ── AI BRIEFING ──
export const dailyBriefing = {
  date: 'March 11, 2026',
  summary: `Strong day. Net revenue hit $48.2k, up 12% vs last Wednesday. Contribution margin expanded to 30.7% driven by a 5.9% AOV increase — the "Spring Bundle" promotion is working. Meta ROAS climbed to 4.04x with the UGC Spring creative continuing to outperform. However, new customer share dipped to 42.3% from 45.5% last week. The Prospecting CBO campaign's reach CPM is trending up ($18.40, +12%), suggesting early audience saturation. Recommend expanding lookalike audiences or testing new creative angles for prospecting.`,
  highlights: [
    'Net revenue $48.2k (+12% WoW)',
    'Contribution margin 30.7% (+1.5pp)',
    'Meta ROAS 4.04x, Google ROAS 3.15x',
  ],
};

// ── ALERTS ──
export const alerts = [
  {
    id: '1',
    severity: 'critical' as const,
    channel: 'meta',
    title: 'Ad "UGC Summer v2" losing $42/day in contribution margin',
    description: 'This ad has negative contribution margin for 7 consecutive days. Total loss: -$294 over the period.',
    recommendation: 'Pause this ad immediately and reallocate budget to "UGC Spring" which is scaling well.',
    timestamp: '10:42 AM',
    date: 'Mar 11, 2026',
    isRead: false,
  },
  {
    id: '2',
    severity: 'warning' as const,
    channel: 'google',
    title: 'PMax "Catch-All" CPA up 34% this week',
    description: 'CPA increased from $42 to $56 over the last 7 days while conversion volume dropped 18%.',
    recommendation: 'Review asset groups and search terms. Consider tightening audience signals.',
    timestamp: '10:42 AM',
    date: 'Mar 11, 2026',
    isRead: false,
  },
  {
    id: '3',
    severity: 'warning' as const,
    channel: 'cross_channel',
    title: 'New customer share dropped to 38% (was 45% last month)',
    description: 'The ratio of first-time buyers has been declining for 3 consecutive weeks.',
    recommendation: 'Increase prospecting budget or refresh creatives. Check Meta incremental reach metrics.',
    timestamp: '10:42 AM',
    date: 'Mar 11, 2026',
    isRead: false,
  },
  {
    id: '4',
    severity: 'info' as const,
    channel: 'shopify',
    title: '"Leather Tote" sell-through rate at 89% — reorder needed',
    description: 'Best-selling product for 5 consecutive days. At current sell rate, stock lasts ~9 days.',
    recommendation: 'Reorder inventory. Current stock of 184 units at 20.3 units/day = ~9 days remaining.',
    timestamp: '10:42 AM',
    date: 'Mar 11, 2026',
    isRead: true,
  },
];

// ── SHOPIFY DATA ──
export const shopifyKPIs = {
  netRevenue: { value: 48230, change: 12.4, sparkline: daily28.map(d => Math.round(38000 * d.multiplier)) },
  orders: { value: 312, change: 6.1, sparkline: daily28.map(d => Math.round(280 * d.multiplier * 0.92)) },
  aov: { value: 154.58, change: 5.9, sparkline: daily28.map(d => +(140 * d.multiplier * 0.98).toFixed(2)) },
  unitsPerOrder: { value: 2.3, change: 4.5, sparkline: daily28.map(d => +(2.1 * d.multiplier * 0.96).toFixed(1)) },
  refundRate: { value: 3.2, change: -0.4, sparkline: daily28.map(d => +(3.5 * d.multiplier * 0.94).toFixed(1)) },
};

export const shopifyRevenueData = daily28.map((d, i) => ({
  date: d.date,
  total: Math.round(38000 + Math.sin(i / 3) * 8000 + i * 400 + (Math.random() - 0.5) * 4000),
  newCustomer: Math.round(16000 + Math.sin(i / 3) * 3000 + i * 100 + (Math.random() - 0.5) * 2000),
  returning: Math.round(22000 + Math.sin(i / 3) * 5000 + i * 300 + (Math.random() - 0.5) * 2000),
}));

export const topProducts = [
  { name: 'Leather Tote', sku: 'LTHR-TOTE-BLK', revenue: 8420, units: 142, aov: 59.30, change: 15 },
  { name: 'Canvas Wallet', sku: 'CNV-WLLT-TAN', revenue: 6210, units: 198, aov: 31.36, change: 8 },
  { name: 'Travel Kit', sku: 'TRVL-KIT-NVY', revenue: 5890, units: 89, aov: 66.18, change: -3 },
  { name: 'Phone Case', sku: 'PHN-CS-MLTCL', revenue: 4120, units: 256, aov: 16.09, change: 22 },
  { name: 'Keychain Set', sku: 'KEY-SET-3PK', revenue: 3450, units: 345, aov: 10.00, change: -8 },
  { name: 'Messenger Bag', sku: 'MSG-BAG-BRN', revenue: 3210, units: 42, aov: 76.43, change: 4 },
  { name: 'Passport Holder', sku: 'PSPRT-HLD-BLK', revenue: 2890, units: 168, aov: 17.20, change: 11 },
  { name: 'Belt Classic', sku: 'BLT-CLS-BLK', revenue: 2450, units: 98, aov: 25.00, change: -2 },
];

export const customerMix = {
  newPct: 42.3,
  returningPct: 57.7,
  newRevenue: 20400,
  returningRevenue: 27830,
  data: daily28.map((d, i) => ({
    date: d.date,
    new: Math.round(42 + Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 3),
    returning: Math.round(58 - Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 3),
  })),
};

export const hourlyOrders = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  orders: Math.round(
    h >= 0 && h < 6 ? 2 + Math.random() * 3 :
    h >= 6 && h < 10 ? 8 + Math.random() * 6 :
    h >= 10 && h < 14 ? 18 + Math.random() * 8 :
    h >= 14 && h < 17 ? 14 + Math.random() * 6 :
    h >= 17 && h < 21 ? 20 + Math.random() * 10 :
    6 + Math.random() * 4
  ),
}));

export const geoData = [
  { state: 'CA', orders: 52, revenue: 8420 },
  { state: 'NY', orders: 38, revenue: 6180 },
  { state: 'TX', orders: 34, revenue: 5240 },
  { state: 'FL', orders: 28, revenue: 4120 },
  { state: 'IL', orders: 22, revenue: 3680 },
  { state: 'PA', orders: 18, revenue: 2890 },
  { state: 'OH', orders: 16, revenue: 2450 },
  { state: 'GA', orders: 14, revenue: 2180 },
  { state: 'WA', orders: 12, revenue: 2050 },
  { state: 'NC', orders: 11, revenue: 1820 },
];

// ── META ADS DATA ──
export const metaKPIs = {
  spend: { value: 8420, change: 6.8, sparkline: daily28.map(d => Math.round(7500 * d.multiplier * 0.95)) },
  revenue: { value: 34020, change: 11.2, sparkline: daily28.map(d => Math.round(28000 * d.multiplier)) },
  roas: { value: 4.04, change: 5.0, sparkline: daily28.map(d => +(3.6 * d.multiplier * 0.97).toFixed(2)) },
  purchases: { value: 186, change: 8.4, sparkline: daily28.map(d => Math.round(160 * d.multiplier * 0.93)) },
  cpa: { value: 45.27, change: -1.5, sparkline: daily28.map(d => +(48 * d.multiplier * 1.01).toFixed(2)) },
  hookRate: { value: 28.4, change: -3.0, sparkline: daily28.map(d => +(30 * d.multiplier * 0.96).toFixed(1)) },
  engagementDepth: { value: 3.8, change: 0.4, sparkline: daily28.map(d => +(3.4 * d.multiplier * 0.97).toFixed(1)) },
  incrROAS: { value: 2.8, change: 8.0, sparkline: daily28.map(d => +(2.4 * d.multiplier * 0.96).toFixed(2)) },
};

export interface MetaAd {
  id: string;
  adName: string;
  campaignName: string;
  adsetName: string;
  status: 'Active' | 'Paused';
  daysActive: number;
  creativeType: 'Video' | 'Image' | 'Carousel';
  // Core 7
  incrROAS: number | null;
  reachCPM: number;
  incrReachPct: number | null;
  contributionMargin: number;
  cmPct: number;
  conversionRate: number;
  aov: number;
  hookRate: number | null;
  engagementDepth: number;
  // Efficiency
  roas: number;
  cpa: number;
  cpc: number;
  ctr: number;
  cpm: number;
  spend: number;
  purchases: number;
  revenue: number;
  // Trends (% change)
  incrROASTrend: number | null;
  reachCPMTrend: number;
  incrReachPctTrend: number | null;
  cmTrend: number;
  convRateTrend: number;
  hookRateTrend: number | null;
  engDepthTrend: number;
  roasTrend: number;
  cpaTrend: number;
  // Lifecycle
  fatigueScore: number;
  frequency: number;
  reachCPMRatio: number;
}

export const metaAds: MetaAd[] = [
  {
    id: '1', adName: 'UGC Spring Review', campaignName: 'Prospecting CBO', adsetName: 'Broad 18-45', status: 'Active', daysActive: 14, creativeType: 'Video',
    incrROAS: 3.2, reachCPM: 18.40, incrReachPct: 72, contributionMargin: 1647, cmPct: 34.2, conversionRate: 4.4, aov: 154, hookRate: 38.2, engagementDepth: 5.4,
    roas: 4.8, cpa: 32, cpc: 1.20, ctr: 2.1, cpm: 22.50, spend: 2100, purchases: 32, revenue: 4928,
    incrROASTrend: 8, reachCPMTrend: 12, incrReachPctTrend: -5, cmTrend: 22, convRateTrend: 1, hookRateTrend: -3, engDepthTrend: 0.2, roasTrend: 5, cpaTrend: -4,
    fatigueScore: 28, frequency: 1.4, reachCPMRatio: 1.22,
  },
  {
    id: '2', adName: 'Lifestyle Carousel', campaignName: 'Prospecting CBO', adsetName: 'Broad 18-45', status: 'Active', daysActive: 7, creativeType: 'Carousel',
    incrROAS: 4.1, reachCPM: 14.20, incrReachPct: 78, contributionMargin: 2103, cmPct: 38.5, conversionRate: 3.8, aov: 168, hookRate: null, engagementDepth: 3.8,
    roas: 4.1, cpa: 28, cpc: 1.40, ctr: 1.4, cpm: 18.20, spend: 1840, purchases: 28, revenue: 4704,
    incrROASTrend: 15, reachCPMTrend: 0, incrReachPctTrend: 3, cmTrend: 31, convRateTrend: 0, hookRateTrend: null, engDepthTrend: 0.6, roasTrend: 12, cpaTrend: -8,
    fatigueScore: 12, frequency: 1.1, reachCPMRatio: 1.08,
  },
  {
    id: '3', adName: 'Static Product Shot', campaignName: 'Retargeting', adsetName: 'Website Visitors 30d', status: 'Active', daysActive: 21, creativeType: 'Image',
    incrROAS: null, reachCPM: 8.20, incrReachPct: null, contributionMargin: 890, cmPct: 22.4, conversionRate: 3.1, aov: 128, hookRate: null, engagementDepth: 2.1,
    roas: 6.8, cpa: 18.50, cpc: 0.85, ctr: 1.8, cpm: 12.40, spend: 1200, purchases: 28, revenue: 3584,
    incrROASTrend: null, reachCPMTrend: 0, incrReachPctTrend: null, cmTrend: 8, convRateTrend: -3, hookRateTrend: null, engDepthTrend: -0.4, roasTrend: 0, cpaTrend: 0,
    fatigueScore: 45, frequency: 2.8, reachCPMRatio: 1.51,
  },
  {
    id: '4', adName: 'UGC Summer Vibes', campaignName: 'Prospecting CBO', adsetName: 'Lookalike 1%', status: 'Active', daysActive: 28, creativeType: 'Video',
    incrROAS: 0.8, reachCPM: 28.60, incrReachPct: 45, contributionMargin: -42, cmPct: -2.1, conversionRate: 2.1, aov: 98, hookRate: 10.2, engagementDepth: 1.2,
    roas: 1.4, cpa: 68, cpc: 2.10, ctr: 0.9, cpm: 34.80, spend: 1900, purchases: 22, revenue: 2156,
    incrROASTrend: -40, reachCPMTrend: 65, incrReachPctTrend: -30, cmTrend: -120, convRateTrend: -20, hookRateTrend: -18, engDepthTrend: -2.1, roasTrend: -35, cpaTrend: 45,
    fatigueScore: 85, frequency: 3.8, reachCPMRatio: 2.42,
  },
  {
    id: '5', adName: 'Carousel DPA Tote', campaignName: 'Retargeting', adsetName: 'ATC 7d', status: 'Active', daysActive: 35, creativeType: 'Carousel',
    incrROAS: null, reachCPM: 7.90, incrReachPct: null, contributionMargin: 1050, cmPct: 26.8, conversionRate: 5.2, aov: 142, hookRate: null, engagementDepth: 2.8,
    roas: 5.6, cpa: 22, cpc: 0.72, ctr: 2.4, cpm: 10.80, spend: 1380, purchases: 30, revenue: 4260,
    incrROASTrend: null, reachCPMTrend: 3, incrReachPctTrend: null, cmTrend: 5, convRateTrend: 2, hookRateTrend: null, engDepthTrend: 0.1, roasTrend: 3, cpaTrend: -2,
    fatigueScore: 38, frequency: 2.2, reachCPMRatio: 1.37,
  },
  {
    id: '6', adName: 'Influencer Testimonial', campaignName: 'Prospecting CBO', adsetName: 'Interest Stack', status: 'Active', daysActive: 5, creativeType: 'Video',
    incrROAS: 3.8, reachCPM: 12.80, incrReachPct: 82, contributionMargin: 1420, cmPct: 36.1, conversionRate: 3.6, aov: 162, hookRate: 42.5, engagementDepth: 6.2,
    roas: 4.5, cpa: 30, cpc: 1.15, ctr: 2.6, cpm: 16.40, spend: 1200, purchases: 24, revenue: 3888,
    incrROASTrend: 12, reachCPMTrend: -8, incrReachPctTrend: 5, cmTrend: 18, convRateTrend: 4, hookRateTrend: 6, engDepthTrend: 1.2, roasTrend: 10, cpaTrend: -6,
    fatigueScore: 8, frequency: 1.0, reachCPMRatio: 1.02,
  },
  {
    id: '7', adName: 'Before/After Wallet', campaignName: 'Prospecting ABO', adsetName: 'Broad 25-55', status: 'Active', daysActive: 18, creativeType: 'Video',
    incrROAS: 2.4, reachCPM: 21.30, incrReachPct: 58, contributionMargin: 680, cmPct: 19.8, conversionRate: 2.8, aov: 134, hookRate: 24.8, engagementDepth: 3.4,
    roas: 3.2, cpa: 42, cpc: 1.55, ctr: 1.5, cpm: 25.60, spend: 1680, purchases: 26, revenue: 3484,
    incrROASTrend: -5, reachCPMTrend: 18, incrReachPctTrend: -8, cmTrend: -12, convRateTrend: -6, hookRateTrend: -10, engDepthTrend: -0.8, roasTrend: -8, cpaTrend: 12,
    fatigueScore: 62, frequency: 2.4, reachCPMRatio: 1.82,
  },
  {
    id: '8', adName: 'Unboxing Experience', campaignName: 'Prospecting CBO', adsetName: 'Broad 18-45', status: 'Paused', daysActive: 42, creativeType: 'Video',
    incrROAS: 1.1, reachCPM: 32.40, incrReachPct: 38, contributionMargin: -180, cmPct: -8.2, conversionRate: 1.8, aov: 112, hookRate: 15.4, engagementDepth: 1.8,
    roas: 1.8, cpa: 58, cpc: 2.40, ctr: 0.8, cpm: 38.20, spend: 2200, purchases: 20, revenue: 2240,
    incrROASTrend: -28, reachCPMTrend: 42, incrReachPctTrend: -22, cmTrend: -85, convRateTrend: -15, hookRateTrend: -25, engDepthTrend: -1.5, roasTrend: -22, cpaTrend: 35,
    fatigueScore: 92, frequency: 4.2, reachCPMRatio: 2.85,
  },
];

export const metaCampaigns = [
  {
    name: 'Prospecting CBO', type: 'CBO', spend: 5840, reachCPM: 16.20, incrReachPct: 68, incrROAS: 3.4,
    cm: 4230, roas: 4.2, purchases: 82, revenue: 14980,
    ads: metaAds.filter(a => a.campaignName === 'Prospecting CBO'),
  },
  {
    name: 'Retargeting', type: 'ABO', spend: 2580, reachCPM: 8.20, incrReachPct: null, incrROAS: null,
    cm: 1940, roas: 6.1, purchases: 58, revenue: 7844,
    ads: metaAds.filter(a => a.campaignName === 'Retargeting'),
  },
  {
    name: 'Prospecting ABO', type: 'ABO', spend: 1680, reachCPM: 21.30, incrReachPct: 58, incrROAS: 2.4,
    cm: 680, roas: 3.2, purchases: 26, revenue: 3484,
    ads: metaAds.filter(a => a.campaignName === 'Prospecting ABO'),
  },
];

// Creative Analysis Matrix
export const creativeMatrix = metaAds.map(ad => ({
  name: ad.adName,
  type: ad.creativeType,
  incrROAS: ad.incrROAS,
  reachCPM: ad.reachCPM,
  incrReachPct: ad.incrReachPct,
  cm: ad.contributionMargin,
  convRate: ad.conversionRate,
  hookRate: ad.hookRate,
  engDepth: ad.engagementDepth,
  score: Math.max(0, Math.min(100, Math.round(
    (ad.incrROAS !== null ? (ad.incrROAS / 4.1) * 20 : 10) +
    (ad.incrReachPct !== null ? (ad.incrReachPct / 82) * 15 : 7) +
    (ad.contributionMargin > 0 ? Math.min(20, (ad.contributionMargin / 2103) * 20) : 0) +
    (ad.conversionRate / 5.2) * 10 +
    (ad.hookRate !== null ? (ad.hookRate / 42.5) * 10 : 5) +
    (ad.engagementDepth / 6.2) * 15 +
    ((1 - ad.reachCPM / 32.4) * 10)
  ))),
}));

// ── GOOGLE ADS DATA ──
export const googleKPIs = {
  spend: { value: 4450, change: 4.2, sparkline: daily28.map(d => Math.round(4000 * d.multiplier * 0.95)) },
  revenue: { value: 14030, change: 6.8, sparkline: daily28.map(d => Math.round(12000 * d.multiplier)) },
  roas: { value: 3.15, change: -2.0, sparkline: daily28.map(d => +(3.2 * d.multiplier * 0.96).toFixed(2)) },
  conversions: { value: 89, change: 3.5, sparkline: daily28.map(d => Math.round(80 * d.multiplier * 0.93)) },
  cpa: { value: 50.0, change: 0.7, sparkline: daily28.map(d => +(48 * d.multiplier * 1.01).toFixed(2)) },
  ctr: { value: 3.82, change: 2.1, sparkline: daily28.map(d => +(3.5 * d.multiplier * 0.97).toFixed(2)) },
};

export const googleCampaigns = [
  { name: 'PMax — Leather Goods', type: 'Performance Max', spend: 2100, revenue: 7420, roas: 3.53, conversions: 42, cpa: 50, ctr: 2.8, impressions: 124000 },
  { name: 'Search — Brand', type: 'Search', spend: 680, revenue: 3450, roas: 5.07, conversions: 24, cpa: 28.33, ctr: 12.4, impressions: 8200 },
  { name: 'Search — Non-Brand', type: 'Search', spend: 1020, revenue: 2180, roas: 2.14, conversions: 16, cpa: 63.75, ctr: 3.2, impressions: 42000 },
  { name: 'Shopping — Feed', type: 'Shopping', spend: 650, revenue: 980, roas: 1.51, conversions: 7, cpa: 92.86, ctr: 1.8, impressions: 38000 },
];

export const googlePmaxBreakdown = [
  { channel: 'Search', spend: 840, conversions: 18, impressions: 52000, color: '#4285F4' },
  { channel: 'YouTube', spend: 420, conversions: 8, impressions: 186000, color: '#FF0000' },
  { channel: 'Display', spend: 320, conversions: 6, impressions: 420000, color: '#34A853' },
  { channel: 'Discover', spend: 280, conversions: 5, impressions: 94000, color: '#FBBC05' },
  { channel: 'Gmail', spend: 240, conversions: 5, impressions: 68000, color: '#EA4335' },
];

export const searchTerms = [
  { term: 'leather tote bag', clicks: 342, impressions: 4200, spend: 410, conversions: 18, convValue: 1420, ctr: 8.14 },
  { term: 'mens canvas wallet', clicks: 228, impressions: 3800, spend: 285, conversions: 12, convValue: 890, ctr: 6.0 },
  { term: 'travel accessories kit', clicks: 186, impressions: 5200, spend: 232, conversions: 8, convValue: 680, ctr: 3.58 },
  { term: 'handmade leather bag', clicks: 164, impressions: 2100, spend: 198, conversions: 6, convValue: 520, ctr: 7.81 },
  { term: 'gift for him leather', clicks: 142, impressions: 3400, spend: 178, conversions: 5, convValue: 410, ctr: 4.18 },
  { term: 'premium phone case', clicks: 98, impressions: 4800, spend: 122, conversions: 3, convValue: 180, ctr: 2.04 },
];

// ── PROFITABILITY / P&L DATA ──
export const profitabilityData = {
  grossRevenue: 48230,
  refunds: 1540,
  netRevenue: 46690,
  cogs: 16342,
  cogsPct: 35,
  fulfillment: 1872,
  processing: 1384,
  grossProfit: 27092,
  metaSpend: 8420,
  googleSpend: 4450,
  contributionMargin: 14222,
  cmPct: 30.5,
  // Comparison data
  avg7d: {
    grossRevenue: 42810, refunds: 1380, netRevenue: 41430, cogs: 14501,
    fulfillment: 1710, processing: 1225, grossProfit: 23994,
    metaSpend: 7800, googleSpend: 4100, contributionMargin: 12094, cmPct: 29.2,
  },
  avg28d: {
    grossRevenue: 40120, refunds: 1290, netRevenue: 38830, cogs: 13591,
    fulfillment: 1580, processing: 1148, grossProfit: 22511,
    metaSpend: 7200, googleSpend: 3900, contributionMargin: 11411, cmPct: 29.4,
  },
};

export const profitabilityTrend = daily28.map((d, i) => ({
  date: d.date,
  cm: Math.round(10000 + Math.sin(i / 3) * 3000 + i * 200 + (Math.random() - 0.5) * 2000),
  cmPct: +(28 + Math.sin(i / 4) * 3 + i * 0.08 + (Math.random() - 0.5) * 1.5).toFixed(1),
}));

export const channelEfficiency = [
  { channel: 'Meta Ads', spend: 8420, revenue: 34020, roas: 4.04, cpa: 45.27, cm: 8440, cmPct: 24.8, color: '#1877F2' },
  { channel: 'Google Ads', spend: 4450, revenue: 14030, roas: 3.15, cpa: 50.0, cm: 3420, cmPct: 24.4, color: '#4285F4' },
  { channel: 'Organic', spend: 0, revenue: 8690, roas: null, cpa: 0, cm: 5650, cmPct: 65.0, color: '#8B5CF6' },
  { channel: 'Email', spend: 0, revenue: 3860, roas: null, cpa: 0, cm: 2510, cmPct: 65.0, color: '#F59E0B' },
  { channel: 'Direct', spend: 0, revenue: 1930, roas: null, cpa: 0, cm: 1250, cmPct: 64.8, color: '#6B7280' },
];

// ── INSIGHTS DATA ──
export const insightBriefings = [
  { type: 'Daily Overall', icon: '📊', date: 'Mar 11, 2026', summary: 'Strong day overall. Net revenue $48.2k (+12%). Contribution margin expanded to 30.7% driven by a 5.9% AOV increase — the Spring Bundle promotion is working.' },
  { type: 'Shopify Summary', icon: '🛍️', date: 'Mar 11, 2026', summary: 'Revenue driven by returning customers. New customer acquisition dipped 3.2%. The Leather Tote continues as the top performer at $8.4k revenue.' },
  { type: 'Meta Ads Summary', icon: '📱', date: 'Mar 11, 2026', summary: 'Top performer: "UGC Spring" at 4.8x ROAS with 38.2% hook rate. Reach CPM trending up on Prospecting CBO ($18.40, +12%). Influencer Testimonial showing early promise with 42.5% hook rate.' },
  { type: 'Google Ads Summary', icon: '🔍', date: 'Mar 11, 2026', summary: 'PMax driving 62% of Google conversions at 3.53x ROAS. Brand Search highly efficient at 5.07x. Non-brand CPA elevated at $63.75 — review keyword strategy.' },
];

// ── SETTINGS DATA ──
export const businessConfig = {
  defaultCogsPct: 35.0,
  avgShippingCost: 5.00,
  avgPackagingCost: 1.50,
  processingFeePct: 2.90,
  perTransactionFee: 0.30,
  includeTaxInRevenue: false,
  includeShippingInRevenue: false,
  targetBlendedROAS: 3.0,
  targetNewCustomerCAC: 45.00,
  targetContributionMarginPct: 28,
  productOverrides: [
    { product: 'Leather Tote', method: 'Fixed', value: '$20.80/unit', lastUpdated: 'Jan 15, 2026' },
    { product: 'Canvas Wallet', method: 'Percentage', value: '28%', lastUpdated: 'Feb 3, 2026' },
    { product: 'Travel Kit', method: 'Fixed', value: '$14.50/unit', lastUpdated: 'Dec 1, 2025' },
  ],
  changeLog: [
    { date: 'Mar 1, 2026', author: 'Sarah', field: 'Default COGS', old: '40%', new: '35%', reason: 'Renegotiated supplier contract, effective March 1' },
    { date: 'Jan 15, 2026', author: 'Mike', field: 'Leather Tote COGS', old: '$18.50/unit', new: '$20.80/unit', reason: 'Actual landed cost from Q4 shipment' },
    { date: 'Dec 1, 2025', author: 'Sarah', field: 'Travel Kit COGS', old: '$12.00/unit', new: '$14.50/unit', reason: 'New packaging materials added' },
    { date: 'Nov 15, 2025', author: 'Mike', field: 'Target Blended ROAS', old: '2.5x', new: '3.0x', reason: 'Q1 profitability targets updated by leadership' },
  ],
};

// ── PRODUCT CROSS-CHANNEL DATA ──
export const productsCrossChannel = topProducts.map((p, i) => ({
  ...p,
  metaSpend: [1840, 920, 680, 420, 280, 540, 320, 180][i] || 300,
  googleSpend: [480, 310, 220, 180, 120, 140, 90, 60][i] || 100,
  metaROAS: [4.2, 5.8, 3.4, 2.8, 4.1, 3.2, 3.8, 2.4][i] || 3.0,
  googleROAS: [3.1, 3.8, 2.6, 2.2, 3.5, 2.8, 3.0, 1.8][i] || 2.5,
  cm: [3633, 2840, 2120, 1580, 1420, 1280, 1120, 880][i] || 1000,
  cmPct: [43.1, 45.7, 36.0, 38.3, 41.2, 39.9, 38.8, 35.9][i] || 35,
  inventory: [184, 420, 62, 890, 1200, 38, 340, 156][i] || 100,
  dailySellRate: [20.3, 28.3, 12.7, 36.6, 49.3, 6.0, 24.0, 14.0][i] || 10,
}));

// ── WATERFALL DATA FOR EXPANDED AD ROW ──
export const adExpandedData = {
  waterfall: [
    { label: 'Revenue', value: 4820, color: '#22C55E' },
    { label: 'COGS', value: -1687, color: '#EF4444' },
    { label: 'Fulfillment', value: -285, color: '#EF4444' },
    { label: 'Processing', value: -144, color: '#EF4444' },
    { label: 'Ad Spend', value: -1057, color: '#EF4444' },
    { label: 'Margin', value: 1647, color: '#22C55E' },
  ],
  videoRetention: [
    { label: '3s', value: 100, pct: 38.2 },
    { label: '25%', value: 72, pct: 27.5 },
    { label: '50%', value: 48, pct: 18.3 },
    { label: '75%', value: 28, pct: 10.7 },
    { label: '100%', value: 12, pct: 4.6 },
  ],
  funnel: [
    { stage: 'Impressions', value: 28400, rate: null },
    { stage: 'Link Clicks', value: 598, rate: 2.1 },
    { stage: 'LP Views', value: 520, rate: 87.0 },
    { stage: 'ATCs', value: 45, rate: 8.7 },
    { stage: 'Checkouts', value: 22, rate: 48.9 },
    { stage: 'Purchases', value: 15, rate: 68.2 },
  ],
  engagement: {
    reactions: 89,
    comments: 12,
    shares: 7,
    saves: 34,
    total: 142,
    depth: 5.4,
  },
};

// ── COHORT DATA ──
export const cohortData = [
  { cohort: 'Oct 2025', size: 420, m0: 100, m1: 28, m2: 22, m3: 18, m4: 15, m5: 12 },
  { cohort: 'Nov 2025', size: 380, m0: 100, m1: 32, m2: 24, m3: 20, m4: 16, m5: null },
  { cohort: 'Dec 2025', size: 510, m0: 100, m1: 35, m2: 26, m3: 21, m4: null, m5: null },
  { cohort: 'Jan 2026', size: 340, m0: 100, m1: 30, m2: 24, m3: null, m4: null, m5: null },
  { cohort: 'Feb 2026', size: 390, m0: 100, m1: 34, m2: null, m3: null, m4: null, m5: null },
  { cohort: 'Mar 2026', size: 180, m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
];
