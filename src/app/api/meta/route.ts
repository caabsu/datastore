import { NextResponse } from "next/server";
import {
  getAccountInsights,
  getAccountInsightsWithBreakdown,
  getCampaigns,
  getAdSets,
  getAds,
  getAdsLightweight,
  computeInsightMetrics,
} from "@/lib/meta";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") ?? "account"; // account | campaigns | adsets | ads

    // Support start/end ISO strings or date_preset
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    let datePreset: string | undefined;
    let timeRange: { since: string; until: string } | undefined;

    if (startParam && endParam) {
      timeRange = {
        since: startParam.substring(0, 10),
        until: endParam.substring(0, 10),
      };
    } else {
      datePreset = searchParams.get("date_preset") ?? "last_7d";
    }

    // Helper to build the date params for Meta API calls
    const dateParams = timeRange
      ? { time_range: timeRange }
      : { date_preset: datePreset! };

    if (level === "all") {
      // ── Consolidated fetch: single round-trip, all Meta API calls in parallel ──
      const [accountInsights, dailyInsights, campaignsRaw, lightAds, audienceInsights] = await Promise.all([
        getAccountInsights(dateParams),
        getAccountInsights({ ...dateParams, time_increment: "1" }),
        getCampaigns(dateParams),
        getAdsLightweight(dateParams),
        getAccountInsightsWithBreakdown({ ...dateParams, breakdowns: "age" }),
      ]);

      // KPIs (shared with funnel below — no duplicate API call)
      const kpis = accountInsights.length > 0 ? computeInsightMetrics(accountInsights[0]) : null;

      // Daily trend
      const dailyTrend = dailyInsights.map((d) => {
        const m = computeInsightMetrics(d);
        return {
          date: m.date_start, spend: m.spend, revenue: m.revenue,
          roas: m.roas, purchases: m.purchases, impressions: m.impressions,
          reach: m.reach, hookRate: m.hookRate, engagementDepth: m.engagementDepth,
        };
      });

      // Campaigns
      const campaigns = campaignsRaw.map((c) => {
        const insight = c.insights?.data?.[0];
        const metrics = insight ? computeInsightMetrics(insight) : null;
        return {
          id: c.id, name: c.name, status: c.status, objective: c.objective,
          buyingType: c.buying_type,
          dailyBudget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
          ...metrics,
        };
      });

      // Funnel — reuse accountInsights (no extra Meta API call)
      let funnel: { stage: string; value: number; rate: number | null }[] = [];
      if (kpis) {
        const funnelData = [
          { stage: "Impressions", value: kpis.impressions },
          { stage: "Link Clicks", value: kpis.linkClicks },
          { stage: "Add to Cart", value: kpis.addToCart },
          { stage: "Initiate Checkout", value: kpis.initiateCheckout },
          { stage: "Purchases", value: kpis.purchases },
        ];
        funnel = funnelData.map((f, i) => ({
          stage: f.stage,
          value: f.value,
          rate: i === 0 || funnelData[i - 1].value === 0
            ? null
            : +((f.value / funnelData[i - 1].value) * 100).toFixed(2),
        }));
      }

      // Creative breakdown — uses lightweight ads (minimal fields, fast)
      const typeColors: Record<string, string> = {
        Video: "#1877F2", Carousel: "#60A5FA", Image: "#93C5FD",
      };
      const groups: Record<string, { count: number; spend: number; revenue: number; purchases: number }> = {};
      for (const ad of lightAds) {
        const name = ad.name?.toLowerCase() ?? "";
        let type = "Image";
        if (name.includes("video") || name.includes("vid") || name.includes("ugc") || name.includes("reel")) type = "Video";
        else if (name.includes("carousel") || name.includes("caro") || name.includes("dpa")) type = "Carousel";
        if (!groups[type]) groups[type] = { count: 0, spend: 0, revenue: 0, purchases: 0 };
        groups[type].count += 1;
        groups[type].spend += ad.spend;
        groups[type].revenue += ad.revenue;
        groups[type].purchases += ad.purchases;
      }
      const creativeBreakdown = Object.entries(groups).map(([type, data]) => ({
        type, count: data.count,
        spend: +data.spend.toFixed(2), revenue: +data.revenue.toFixed(2),
        roas: data.spend > 0 ? +(data.revenue / data.spend).toFixed(2) : 0,
        purchases: data.purchases,
        cpa: data.purchases > 0 ? +(data.spend / data.purchases).toFixed(2) : 0,
        cm: +(data.revenue - data.spend).toFixed(2),
        color: typeColors[type] ?? "#71717A",
      }));

      // Audience breakdown
      const ageColors: Record<string, string> = {
        "18-24": "#1877F2", "25-34": "#3B82F6", "35-44": "#60A5FA",
        "45-54": "#93C5FD", "55-64": "#BFDBFE", "65+": "#DBEAFE",
      };
      const audienceBreakdown = audienceInsights.map((insight) => {
        const m = computeInsightMetrics(insight);
        const ageGroup = insight.age ?? "Unknown";
        return {
          audience: ageGroup, spend: +m.spend.toFixed(2), revenue: +m.revenue.toFixed(2),
          roas: m.roas ? +m.roas.toFixed(2) : 0, purchases: m.purchases,
          reachCPM: +m.reachCPM.toFixed(2), color: ageColors[ageGroup] ?? "#71717A",
        };
      });

      return NextResponse.json({
        kpis, dailyTrend, campaigns, funnel, creativeBreakdown, audienceBreakdown,
      });
    }

    if (level === "account") {
      // Account-level KPIs
      const [insights, dailyInsights] = await Promise.all([
        getAccountInsights(dateParams),
        getAccountInsights({ ...dateParams, time_increment: "1" }),
      ]);

      const kpis = insights.length > 0 ? computeInsightMetrics(insights[0]) : null;

      // Daily trend for sparklines / charts
      const dailyTrend = dailyInsights.map((d) => {
        const m = computeInsightMetrics(d);
        return {
          date: m.date_start,
          spend: m.spend,
          revenue: m.revenue,
          roas: m.roas,
          purchases: m.purchases,
          impressions: m.impressions,
          reach: m.reach,
          hookRate: m.hookRate,
          engagementDepth: m.engagementDepth,
        };
      });

      return NextResponse.json({ kpis, dailyTrend });
    }

    if (level === "campaigns") {
      const campaigns = await getCampaigns(dateParams);
      const formatted = campaigns.map((c) => {
        const insight = c.insights?.data?.[0];
        const metrics = insight ? computeInsightMetrics(insight) : null;
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          buyingType: c.buying_type,
          dailyBudget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
          ...metrics,
        };
      });
      return NextResponse.json({ campaigns: formatted });
    }

    if (level === "adsets") {
      const campaignId = searchParams.get("campaign_id") ?? undefined;
      const adSets = await getAdSets({ campaignId, ...dateParams });
      const formatted = adSets.map((s) => {
        const insight = s.insights?.data?.[0];
        const metrics = insight ? computeInsightMetrics(insight) : null;
        return {
          id: s.id,
          name: s.name,
          campaignId: s.campaign_id,
          status: s.status,
          optimizationGoal: s.optimization_goal,
          targeting: s.targeting,
          dailyBudget: s.daily_budget ? parseFloat(s.daily_budget) / 100 : null,
          ...metrics,
        };
      });
      return NextResponse.json({ adSets: formatted });
    }

    if (level === "ads") {
      const adSetId = searchParams.get("adset_id") ?? undefined;
      const ads = await getAds({ adSetId, ...dateParams });
      const formatted = ads.map((a) => {
        const insight = a.insights?.data?.[0];
        const metrics = insight ? computeInsightMetrics(insight) : null;
        return {
          id: a.id,
          name: a.name,
          adsetId: a.adset_id,
          campaignId: a.campaign_id,
          status: a.status,
          creative: a.creative,
          ...metrics,
        };
      });
      return NextResponse.json({ ads: formatted });
    }

    if (level === "funnel") {
      // Conversion funnel — account-level aggregate
      const insights = await getAccountInsights(dateParams);
      if (insights.length === 0) {
        return NextResponse.json({ funnel: [] });
      }

      const m = computeInsightMetrics(insights[0]);

      const stages: { stage: string; value: number; rate: number | null }[] = [];
      const funnelData = [
        { stage: "Impressions", value: m.impressions },
        { stage: "Link Clicks", value: m.linkClicks },
        { stage: "Add to Cart", value: m.addToCart },
        { stage: "Initiate Checkout", value: m.initiateCheckout },
        { stage: "Purchases", value: m.purchases },
      ];

      for (let i = 0; i < funnelData.length; i++) {
        const { stage, value } = funnelData[i];
        const rate =
          i === 0 || funnelData[i - 1].value === 0
            ? null
            : +((value / funnelData[i - 1].value) * 100).toFixed(2);
        stages.push({ stage, value, rate });
      }

      return NextResponse.json({ funnel: stages });
    }

    if (level === "creative_breakdown") {
      // Fetch all ads with insights and group by creative type
      const ads = await getAds(dateParams);

      // Derive creative type from the creative object or ad name
      function deriveCreativeType(ad: (typeof ads)[number]): string {
        const name = ad.name?.toLowerCase() ?? "";
        // Check name patterns first
        if (name.includes("video") || name.includes("vid") || name.includes("ugc") || name.includes("reel")) return "Video";
        if (name.includes("carousel") || name.includes("caro") || name.includes("dpa")) return "Carousel";
        if (name.includes("image") || name.includes("img") || name.includes("static")) return "Image";
        // Default heuristic — if creative has thumbnail it might be video, otherwise image
        return "Image";
      }

      const typeColors: Record<string, string> = {
        Video: "#1877F2",
        Carousel: "#60A5FA",
        Image: "#93C5FD",
      };

      const groups: Record<
        string,
        { count: number; spend: number; revenue: number; purchases: number }
      > = {};

      for (const ad of ads) {
        const type = deriveCreativeType(ad);
        const insight = ad.insights?.data?.[0];
        const m = insight ? computeInsightMetrics(insight) : null;
        if (!groups[type]) {
          groups[type] = { count: 0, spend: 0, revenue: 0, purchases: 0 };
        }
        groups[type].count += 1;
        groups[type].spend += m?.spend ?? 0;
        groups[type].revenue += m?.revenue ?? 0;
        groups[type].purchases += m?.purchases ?? 0;
      }

      const creativeBreakdown = Object.entries(groups).map(
        ([type, data]) => ({
          type,
          count: data.count,
          spend: +data.spend.toFixed(2),
          revenue: +data.revenue.toFixed(2),
          roas: data.spend > 0 ? +(data.revenue / data.spend).toFixed(2) : 0,
          purchases: data.purchases,
          cpa:
            data.purchases > 0
              ? +(data.spend / data.purchases).toFixed(2)
              : 0,
          cm: +(data.revenue - data.spend).toFixed(2),
          color: typeColors[type] ?? "#71717A",
        })
      );

      return NextResponse.json({ creativeBreakdown });
    }

    if (level === "audience_breakdown") {
      // Fetch account insights broken down by age group
      const insights = await getAccountInsightsWithBreakdown({
        ...dateParams,
        breakdowns: "age",
      });

      const ageColors: Record<string, string> = {
        "18-24": "#1877F2",
        "25-34": "#3B82F6",
        "35-44": "#60A5FA",
        "45-54": "#93C5FD",
        "55-64": "#BFDBFE",
        "65+": "#DBEAFE",
      };

      const audienceBreakdown = insights.map((insight) => {
        const m = computeInsightMetrics(insight);
        const ageGroup = insight.age ?? "Unknown";
        return {
          audience: ageGroup,
          spend: +m.spend.toFixed(2),
          revenue: +m.revenue.toFixed(2),
          roas: m.roas ? +m.roas.toFixed(2) : 0,
          purchases: m.purchases,
          reachCPM: +m.reachCPM.toFixed(2),
          color: ageColors[ageGroup] ?? "#71717A",
        };
      });

      return NextResponse.json({ audienceBreakdown });
    }

    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  } catch (error) {
    console.error("Meta API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Meta API error" },
      { status: 500 }
    );
  }
}
