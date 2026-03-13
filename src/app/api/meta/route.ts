import { NextResponse } from "next/server";
import {
  getAccountInsights,
  getCampaigns,
  getAdSets,
  getAds,
  computeInsightMetrics,
} from "@/lib/meta";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const datePreset = searchParams.get("date_preset") ?? "last_7d";
    const level = searchParams.get("level") ?? "account"; // account | campaigns | adsets | ads

    if (level === "account") {
      // Account-level KPIs
      const [insights, dailyInsights] = await Promise.all([
        getAccountInsights({ date_preset: datePreset }),
        getAccountInsights({ date_preset: "last_28d", time_increment: "1" }),
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
        };
      });

      return NextResponse.json({ kpis, dailyTrend });
    }

    if (level === "campaigns") {
      const campaigns = await getCampaigns({ date_preset: datePreset });
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
      const adSets = await getAdSets({ campaignId, date_preset: datePreset });
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
      const ads = await getAds({ adSetId, date_preset: datePreset });
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

    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  } catch (error) {
    console.error("Meta API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Meta API error" },
      { status: 500 }
    );
  }
}
