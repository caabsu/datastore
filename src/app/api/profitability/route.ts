import { NextResponse } from "next/server";
import { getOrders, computeShopifyKPIs } from "@/lib/shopify";
import { getAccountInsights, computeInsightMetrics } from "@/lib/meta";

// Default business config (hardcoded until DB-backed settings are added)
const DEFAULTS = {
  cogsPct: 35,
  avgShippingCost: 5.5,
  avgPackagingCost: 1.25,
  processingFeePct: 2.9,
  perTransactionFee: 0.3,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    let now: Date;
    let startDate: Date;

    if (startParam && endParam) {
      startDate = new Date(startParam);
      now = new Date(endParam);
    } else {
      const d = parseInt(searchParams.get("days") ?? "7");
      now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - d);
    }

    const days = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 86_400_000));
    const prevStart = new Date(startDate);
    prevStart.setDate(startDate.getDate() - days);

    // Fetch Shopify orders (current + previous) and Meta insights in parallel
    const [currentOrders, prevOrders, metaInsights, metaPrevInsights] =
      await Promise.all([
        getOrders({
          created_at_min: startDate.toISOString(),
          created_at_max: now.toISOString(),
          status: "any",
        }),
        getOrders({
          created_at_min: prevStart.toISOString(),
          created_at_max: startDate.toISOString(),
          status: "any",
        }),
        getAccountInsights({ date_preset: days <= 7 ? "last_7d" : "last_28d" }),
        getAccountInsights({
          date_preset: days <= 7 ? "last_7d" : "last_28d",
        }),
      ]);

    const currentKPIs = computeShopifyKPIs(currentOrders, startDate);
    const prevKPIs = computeShopifyKPIs(prevOrders, prevStart);

    const metaMetrics =
      metaInsights.length > 0 ? computeInsightMetrics(metaInsights[0]) : null;

    const grossRevenue = currentKPIs.totalRevenue;
    const refunds = currentKPIs.totalRefunds;
    const netRevenue = currentKPIs.netRevenue;
    const paidOrders = currentOrders.filter(
      (o) =>
        o.financial_status === "paid" ||
        o.financial_status === "partially_refunded"
    ).length;

    // Cost calculations
    const cogs = +(netRevenue * (DEFAULTS.cogsPct / 100)).toFixed(2);
    const fulfillment = +(
      paidOrders *
      (DEFAULTS.avgShippingCost + DEFAULTS.avgPackagingCost)
    ).toFixed(2);
    const processing = +(
      netRevenue * (DEFAULTS.processingFeePct / 100) +
      paidOrders * DEFAULTS.perTransactionFee
    ).toFixed(2);
    const grossProfit = +(netRevenue - cogs - fulfillment - processing).toFixed(
      2
    );

    const metaSpend = metaMetrics?.spend ?? 0;
    const googleSpend = 0; // No Google API yet
    const contributionMargin = +(
      grossProfit -
      metaSpend -
      googleSpend
    ).toFixed(2);
    const cmPct =
      netRevenue > 0 ? +((contributionMargin / netRevenue) * 100).toFixed(1) : 0;

    // Previous period for comparison
    const prevGrossRevenue = prevKPIs.totalRevenue;
    const prevRefunds = prevKPIs.totalRefunds;
    const prevNetRevenue = prevKPIs.netRevenue;
    const prevPaidOrders = prevOrders.filter(
      (o) =>
        o.financial_status === "paid" ||
        o.financial_status === "partially_refunded"
    ).length;
    const prevCogs = +(prevNetRevenue * (DEFAULTS.cogsPct / 100)).toFixed(2);
    const prevFulfillment = +(
      prevPaidOrders *
      (DEFAULTS.avgShippingCost + DEFAULTS.avgPackagingCost)
    ).toFixed(2);
    const prevProcessing = +(
      prevNetRevenue * (DEFAULTS.processingFeePct / 100) +
      prevPaidOrders * DEFAULTS.perTransactionFee
    ).toFixed(2);
    const prevGrossProfit = +(
      prevNetRevenue -
      prevCogs -
      prevFulfillment -
      prevProcessing
    ).toFixed(2);
    const prevCM = +(prevGrossProfit - metaSpend - googleSpend).toFixed(2);
    const prevCMPct =
      prevNetRevenue > 0
        ? +((prevCM / prevNetRevenue) * 100).toFixed(1)
        : 0;

    // Daily CM trend from Shopify daily revenue
    const dailyMap = new Map<
      string,
      { revenue: number; orders: number; refunds: number }
    >();
    currentOrders.forEach((o) => {
      const day = o.created_at.substring(0, 10);
      const entry = dailyMap.get(day) ?? { revenue: 0, orders: 0, refunds: 0 };
      const orderTotal = parseFloat(o.subtotal_price);
      const refundAmt =
        o.refunds?.reduce(
          (sum, r) =>
            sum +
            r.refund_line_items.reduce(
              (s, li) => s + li.subtotal,
              0
            ),
          0
        ) ?? 0;
      entry.revenue += orderTotal;
      entry.refunds += refundAmt;
      entry.orders += 1;
      dailyMap.set(day, entry);
    });

    const cmTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const dayNet = d.revenue - d.refunds;
        const dayCogs = dayNet * (DEFAULTS.cogsPct / 100);
        const dayFulfill =
          d.orders * (DEFAULTS.avgShippingCost + DEFAULTS.avgPackagingCost);
        const dayProc =
          dayNet * (DEFAULTS.processingFeePct / 100) +
          d.orders * DEFAULTS.perTransactionFee;
        const dayGP = dayNet - dayCogs - dayFulfill - dayProc;
        // Allocate ad spend evenly across days
        const daysCount = dailyMap.size || 1;
        const dayMeta = metaSpend / daysCount;
        const dayCM = dayGP - dayMeta;
        const dayCMPct = dayNet > 0 ? (dayCM / dayNet) * 100 : 0;
        return {
          date,
          cm: +dayCM.toFixed(2),
          cmPct: +dayCMPct.toFixed(1),
        };
      });

    // Channel efficiency
    const metaRevenue = metaMetrics?.revenue ?? 0;
    const organicRevenue = Math.max(netRevenue - metaRevenue, 0);

    const channels = [
      {
        channel: "Meta Ads",
        color: "#1877F2",
        spend: metaSpend,
        revenue: metaRevenue,
        roas: metaSpend > 0 ? +(metaRevenue / metaSpend).toFixed(2) : null,
        cpa:
          metaMetrics && metaMetrics.purchases > 0
            ? +(metaSpend / metaMetrics.purchases).toFixed(2)
            : 0,
        cm: +(metaRevenue - metaRevenue * (DEFAULTS.cogsPct / 100) - metaSpend).toFixed(2),
        cmPct:
          metaRevenue > 0
            ? +(
                ((metaRevenue -
                  metaRevenue * (DEFAULTS.cogsPct / 100) -
                  metaSpend) /
                  metaRevenue) *
                100
              ).toFixed(1)
            : 0,
      },
      {
        channel: "Organic / Direct",
        color: "#8B5CF6",
        spend: 0,
        revenue: organicRevenue,
        roas: null,
        cpa: 0,
        cm: +(organicRevenue - organicRevenue * (DEFAULTS.cogsPct / 100)).toFixed(2),
        cmPct:
          organicRevenue > 0
            ? +(
                ((organicRevenue - organicRevenue * (DEFAULTS.cogsPct / 100)) /
                  organicRevenue) *
                100
              ).toFixed(1)
            : 0,
      },
    ];

    return NextResponse.json({
      summary: {
        grossRevenue,
        refunds,
        netRevenue,
        cogs,
        cogsPct: DEFAULTS.cogsPct,
        fulfillment,
        processing,
        grossProfit,
        metaSpend,
        googleSpend,
        contributionMargin,
        cmPct,
      },
      previous: {
        grossRevenue: prevGrossRevenue,
        refunds: prevRefunds,
        netRevenue: prevNetRevenue,
        cogs: prevCogs,
        fulfillment: prevFulfillment,
        processing: prevProcessing,
        grossProfit: prevGrossProfit,
        metaSpend: metaSpend,
        googleSpend: 0,
        contributionMargin: prevCM,
        cmPct: prevCMPct,
      },
      cmTrend,
      channels,
    });
  } catch (error) {
    console.error("Profitability API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profitability API error" },
      { status: 500 }
    );
  }
}
