import { NextResponse } from "next/server";
import { getOrders, computeShopifyKPIs } from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "7");

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - days);

    // Current period orders
    const currentOrders = await getOrders({
      created_at_min: startDate.toISOString(),
      created_at_max: now.toISOString(),
      status: "any",
    });

    // Previous period for comparison
    const prevOrders = await getOrders({
      created_at_min: prevStartDate.toISOString(),
      created_at_max: startDate.toISOString(),
      status: "any",
    });

    const current = computeShopifyKPIs(currentOrders);
    const previous = computeShopifyKPIs(prevOrders);

    // Calculate changes
    const pctChange = (curr: number, prev: number) =>
      prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

    // Daily breakdown for sparklines
    const dailyMap = new Map<string, number>();
    currentOrders.forEach((o) => {
      const day = o.created_at.substring(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + parseFloat(o.subtotal_price));
    });
    const dailyRevenue = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    // Daily orders breakdown (new vs returning)
    const dailyOrdersMap = new Map<string, { newOrders: number; repeatOrders: number }>();
    currentOrders
      .filter((o) => o.financial_status === "paid" || o.financial_status === "partially_refunded")
      .forEach((o) => {
        const day = o.created_at.substring(0, 10);
        const entry = dailyOrdersMap.get(day) ?? { newOrders: 0, repeatOrders: 0 };
        if (o.customer && o.customer.orders_count <= 1) {
          entry.newOrders++;
        } else {
          entry.repeatOrders++;
        }
        dailyOrdersMap.set(day, entry);
      });
    const dailyOrders = Array.from(dailyOrdersMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // Product breakdown
    const productMap = new Map<string, { revenue: number; units: number }>();
    currentOrders
      .filter((o) => o.financial_status === "paid" || o.financial_status === "partially_refunded")
      .forEach((o) => {
        o.line_items.forEach((li) => {
          const key = li.title;
          const entry = productMap.get(key) ?? { revenue: 0, units: 0 };
          entry.revenue += parseFloat(li.price) * li.quantity;
          entry.units += li.quantity;
          productMap.set(key, entry);
        });
      });
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        units: data.units,
        aov: data.units > 0 ? data.revenue / data.units : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      kpis: {
        netRevenue: { value: current.netRevenue, change: pctChange(current.netRevenue, previous.netRevenue) },
        orders: { value: current.totalOrders, change: pctChange(current.totalOrders, previous.totalOrders) },
        aov: { value: current.aov, change: pctChange(current.aov, previous.aov) },
        unitsPerOrder: { value: current.unitsPerOrder, change: pctChange(current.unitsPerOrder, previous.unitsPerOrder) },
        refundRate: { value: current.refundRate, change: pctChange(current.refundRate, previous.refundRate) },
        newCustomerPct: { value: current.newCustomerPct, change: pctChange(current.newCustomerPct, previous.newCustomerPct) },
      },
      dailyRevenue,
      dailyOrders,
      topProducts,
      rawCount: currentOrders.length,
    });
  } catch (error) {
    console.error("Shopify API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Shopify API error" },
      { status: 500 }
    );
  }
}
