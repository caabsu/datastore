import { NextResponse } from "next/server";
import {
  getOrders,
  getDisputes,
  type ShopifyOrder,
} from "@/lib/shopify";

/**
 * Returns API — fetches orders updated in the selected period to capture
 * refund and cancellation activity, then filters by actual refund/cancel dates.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

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

    // Fetch orders UPDATED in the range (catches refund/cancel activity on older orders)
    // Also fetch disputes in parallel
    const [updatedOrders, disputes] = await Promise.all([
      getOrders({
        updated_at_min: startDate.toISOString(),
        updated_at_max: endDate.toISOString(),
        status: "any",
      }),
      getDisputes(),
    ]);

    // ── Refund Analytics ──
    // Filter to orders that have monetary refunds created within the date range
    function hasRefundInRange(order: ShopifyOrder): boolean {
      return order.refunds.some((r) => {
        try {
          const refundDate = new Date(r.created_at);
          if (refundDate < startDate || refundDate > endDate) return false;
          // Must have at least one non-zero refund line item
          return r.refund_line_items.some((rli) => rli.subtotal > 0);
        } catch {
          return false;
        }
      });
    }

    // Get only refunds within the date range per order (with monetary value)
    function getRefundsInRange(order: ShopifyOrder) {
      return order.refunds
        .filter((r) => {
          try {
            const refundDate = new Date(r.created_at);
            return refundDate >= startDate && refundDate <= endDate;
          } catch {
            return false;
          }
        })
        .map((r) => ({
          ...r,
          refund_line_items: r.refund_line_items.filter((rli) => rli.subtotal > 0),
        }))
        .filter((r) => r.refund_line_items.length > 0);
    }

    const ordersWithRefundsInRange = updatedOrders.filter(hasRefundInRange);

    // Analytics
    let totalRefundAmount = 0;
    let totalRefundedUnits = 0;
    let fullRefunds = 0;
    let partialRefunds = 0;

    ordersWithRefundsInRange.forEach((o) => {
      const rangeRefunds = getRefundsInRange(o);
      rangeRefunds.forEach((r) => {
        r.refund_line_items.forEach((rli) => {
          totalRefundAmount += rli.subtotal;
          totalRefundedUnits += rli.quantity;
        });
      });
      if (o.financial_status === "refunded") fullRefunds++;
      else if (o.financial_status === "partially_refunded") partialRefunds++;
    });

    const totalRefundOrders = ordersWithRefundsInRange.length;
    const avgRefundValue = totalRefundOrders > 0 ? totalRefundAmount / totalRefundOrders : 0;
    // Rate: refunded orders / all orders updated in range
    const totalOrdersInRange = updatedOrders.length;
    const refundRate = totalOrdersInRange > 0
      ? (totalRefundOrders / totalOrdersInRange) * 100
      : 0;

    const analytics = {
      totalRefundOrders,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
      totalRefundedUnits,
      fullRefunds,
      partialRefunds,
      avgRefundValue: Math.round(avgRefundValue * 100) / 100,
      refundRate: Math.round(refundRate * 10) / 10,
    };

    // ── Returns by Product ──
    const productMap = new Map<
      string,
      {
        product: string;
        sku: string;
        unitsSold: number;
        unitsReturned: number;
        refundAmount: number;
        revenue: number;
        orderNumbers: string[];
      }
    >();

    ordersWithRefundsInRange.forEach((o) => {
      const lineItemMap = new Map<number, (typeof o.line_items)[0]>();
      o.line_items.forEach((li) => lineItemMap.set(li.id, li));

      // Track units sold from this order
      o.line_items.forEach((li) => {
        const key = li.title;
        const entry = productMap.get(key) ?? {
          product: li.title,
          sku: li.sku || "—",
          unitsSold: 0,
          unitsReturned: 0,
          refundAmount: 0,
          revenue: 0,
          orderNumbers: [],
        };
        entry.unitsSold += li.quantity;
        entry.revenue += parseFloat(li.price) * li.quantity;
        if (!entry.sku || entry.sku === "—") entry.sku = li.sku || "—";
        productMap.set(key, entry);
      });

      // Map refunds to products
      const rangeRefunds = getRefundsInRange(o);
      rangeRefunds.forEach((r) => {
        r.refund_line_items.forEach((rli) => {
          const li = lineItemMap.get(rli.line_item_id);
          if (!li) return;
          const key = li.title;
          const entry = productMap.get(key)!;
          entry.unitsReturned += rli.quantity;
          entry.refundAmount += rli.subtotal;
          if (!entry.orderNumbers.includes(o.name)) {
            entry.orderNumbers.push(o.name);
          }
        });
      });
    });

    const byProduct = Array.from(productMap.values())
      .filter((p) => p.unitsReturned > 0)
      .map((p) => ({
        ...p,
        refundAmount: Math.round(p.refundAmount * 100) / 100,
        revenue: Math.round(p.revenue * 100) / 100,
        returnRate:
          p.unitsSold > 0
            ? Math.round((p.unitsReturned / p.unitsSold) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.refundAmount - a.refundAmount);

    // ── Return Timeline (by ORDER date) ──
    const timelineMap = new Map<
      string,
      { refundedOrders: number; units: number; amount: number }
    >();

    ordersWithRefundsInRange.forEach((o) => {
      const orderDate = o.created_at.substring(0, 10);
      const entry = timelineMap.get(orderDate) ?? {
        refundedOrders: 0,
        units: 0,
        amount: 0,
      };
      entry.refundedOrders++;
      const rangeRefunds = getRefundsInRange(o);
      rangeRefunds.forEach((r) => {
        r.refund_line_items.forEach((rli) => {
          entry.units += rli.quantity;
          entry.amount += rli.subtotal;
        });
      });
      timelineMap.set(orderDate, entry);
    });

    const timeline = Array.from(timelineMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        refundedOrders: d.refundedOrders,
        refundedUnits: d.units,
        refundAmount: Math.round(d.amount * 100) / 100,
      }));

    // ── Refunded Order Details ──
    const refundedOrders = ordersWithRefundsInRange
      .map((o) => {
        const rangeRefunds = getRefundsInRange(o);
        const refundTotal = rangeRefunds.reduce(
          (rs, r) =>
            rs + r.refund_line_items.reduce((rls, rl) => rls + rl.subtotal, 0),
          0
        );
        const refundUnits = rangeRefunds.reduce(
          (rs, r) =>
            rs + r.refund_line_items.reduce((rls, rl) => rls + rl.quantity, 0),
          0
        );
        const latestRefund = [...rangeRefunds].sort((a, b) =>
          b.created_at.localeCompare(a.created_at)
        )[0];

        const lineItemMap = new Map<number, string>();
        o.line_items.forEach((li) => lineItemMap.set(li.id, li.title));
        const refundedProducts = rangeRefunds.flatMap((r) =>
          r.refund_line_items.map((rli) => ({
            product: lineItemMap.get(rli.line_item_id) ?? "Unknown",
            quantity: rli.quantity,
            amount: Math.round(rli.subtotal * 100) / 100,
          }))
        );

        return {
          orderNumber: o.name,
          orderId: o.id,
          orderDate: o.created_at,
          customer: o.customer
            ? `${o.customer.first_name} ${o.customer.last_name}`.trim()
            : "Guest",
          customerEmail: o.customer?.email ?? null,
          orderTotal: parseFloat(o.total_price),
          refundAmount: Math.round(refundTotal * 100) / 100,
          refundedUnits: refundUnits,
          refundDate: latestRefund?.created_at ?? null,
          refundNote: latestRefund?.note ?? null,
          financialStatus: o.financial_status,
          refundedProducts,
        };
      })
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate));

    // ── Cancellations ──
    // Filter to orders cancelled within the date range
    const cancelledInRange = updatedOrders.filter((o) => {
      if (!o.cancelled_at) return false;
      try {
        const cancelDate = new Date(o.cancelled_at);
        return cancelDate >= startDate && cancelDate <= endDate;
      } catch {
        return false;
      }
    });

    const cancelReasonMap = new Map<string, number>();
    cancelledInRange.forEach((o) => {
      const reason = o.cancel_reason || "other";
      cancelReasonMap.set(reason, (cancelReasonMap.get(reason) ?? 0) + 1);
    });

    const totalCancelledValue = cancelledInRange.reduce(
      (s, o) => s + parseFloat(o.total_price),
      0
    );

    const cancellations = {
      totalCancelled: cancelledInRange.length,
      cancellationRate:
        totalOrdersInRange > 0
          ? Math.round(
              (cancelledInRange.length / totalOrdersInRange) * 1000
            ) / 10
          : 0,
      totalCancelledValue: Math.round(totalCancelledValue * 100) / 100,
      reasons: Array.from(cancelReasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      details: cancelledInRange
        .map((o) => ({
          orderNumber: o.name,
          orderId: o.id,
          orderDate: o.created_at,
          cancelledAt: o.cancelled_at!,
          cancelReason: o.cancel_reason || "other",
          customer: o.customer
            ? `${o.customer.first_name} ${o.customer.last_name}`.trim()
            : "Guest",
          orderTotal: parseFloat(o.total_price),
          items: o.line_items.map((li) => ({
            title: li.title,
            quantity: li.quantity,
            price: parseFloat(li.price),
          })),
        }))
        .sort((a, b) => b.cancelledAt.localeCompare(a.cancelledAt)),
    };

    // ── Disputes ──
    const rangeDisputes = disputes.filter((d) => {
      try {
        const initiated = new Date(d.initiated_at);
        return initiated >= startDate && initiated <= endDate;
      } catch {
        return false;
      }
    });

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
