import { NextResponse } from "next/server";
import {
  getOrders,
  getDisputes,
  computeReturnsAnalytics,
  computeReturnsByProduct,
  computeReturnTimeline,
  computeRefundedOrderDetails,
  computeCancellations,
} from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Accept start/end ISO strings or fall back to days
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    let startDate: Date;
    let endDate: Date;

    if (startParam && endParam) {
      startDate = new Date(startParam);
      endDate = new Date(endParam);
    } else {
      const days = parseInt(searchParams.get("days") ?? "7");
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
    }

    // Fetch orders + disputes in parallel
    const [orders, disputes] = await Promise.all([
      getOrders({
        created_at_min: startDate.toISOString(),
        created_at_max: endDate.toISOString(),
        status: "any",
      }),
      getDisputes(),
    ]);

    // Filter disputes to the date range
    const rangeDisputes = disputes.filter((d) => {
      try {
        const initiated = new Date(d.initiated_at);
        return initiated >= startDate && initiated <= endDate;
      } catch {
        return false;
      }
    });

    const analytics = computeReturnsAnalytics(orders);
    const byProduct = computeReturnsByProduct(orders);
    const timeline = computeReturnTimeline(orders);
    const refundedOrders = computeRefundedOrderDetails(orders);
    const cancellations = computeCancellations(orders);

    // Dispute summary
    const disputeSummary = {
      total: rangeDisputes.length,
      totalAmount: rangeDisputes.reduce(
        (s, d) => s + parseFloat(d.amount || "0"),
        0
      ),
      byStatus: Object.entries(
        rangeDisputes.reduce(
          (acc, d) => {
            acc[d.status] = (acc[d.status] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      )
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      byReason: Object.entries(
        rangeDisputes.reduce(
          (acc, d) => {
            acc[d.reason] = (acc[d.reason] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      )
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      details: rangeDisputes.map((d) => ({
        id: d.id,
        type: d.type,
        amount: parseFloat(d.amount || "0"),
        currency: d.currency,
        reason: d.reason,
        status: d.status,
        evidenceDueBy: d.evidence_due_by,
        finalizedOn: d.finalized_on,
        initiatedAt: d.initiated_at,
        orderId: d.order_id,
      })),
    };

    return NextResponse.json({
      analytics,
      byProduct,
      timeline,
      refundedOrders,
      cancellations,
      disputes: disputeSummary,
    });
  } catch (error) {
    console.error("Returns API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Returns API error",
      },
      { status: 500 }
    );
  }
}
