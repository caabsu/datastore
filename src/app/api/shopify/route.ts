import { NextResponse } from "next/server";
import {
  getOrders,
  getProducts,
  getCustomers,
  computeShopifyKPIs,
  computeCustomerMix,
  computeHourlyOrders,
  computeGeoData,
  computeCategories,
  computeTopProducts,
  computeLTV,
  computeRepeatData,
  computeCohortData,
} from "@/lib/shopify";

/**
 * Determine if a customer is "new" during the period.
 * Uses customer.created_at vs periodStart — if the customer account
 * was created during this window, they are a new customer.
 */
function isNewInPeriod(
  order: { customer: { created_at: string } | null },
  periodStart: Date
): boolean {
  if (!order.customer) return false;
  try {
    return new Date(order.customer.created_at) >= periodStart;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Accept start/end ISO strings or fall back to days
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    let now: Date;
    let startDate: Date;

    if (startParam && endParam) {
      startDate = new Date(startParam);
      now = new Date(endParam);
    } else {
      const days = parseInt(searchParams.get("days") ?? "7");
      now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - days);
    }

    const days = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 86_400_000));
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - days);

    // Fetch all data in parallel: current orders, previous orders, products, customers
    const [currentOrders, prevOrders, products, customers] = await Promise.all([
      getOrders({
        created_at_min: startDate.toISOString(),
        created_at_max: now.toISOString(),
        status: "any",
      }),
      getOrders({
        created_at_min: prevStartDate.toISOString(),
        created_at_max: startDate.toISOString(),
        status: "any",
      }),
      getProducts({ limit: 250 }),
      getCustomers({ limit: 250 }),
    ]);

    // Pass periodStart so new/returning is determined by customer.created_at
    const current = computeShopifyKPIs(currentOrders, startDate);
    const previous = computeShopifyKPIs(prevOrders, prevStartDate);

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

    // Daily orders breakdown (new vs returning) — use customer.created_at
    const dailyOrdersMap = new Map<string, { newOrders: number; repeatOrders: number }>();
    currentOrders
      .filter((o) => o.financial_status === "paid" || o.financial_status === "partially_refunded")
      .forEach((o) => {
        const day = o.created_at.substring(0, 10);
        const entry = dailyOrdersMap.get(day) ?? { newOrders: 0, repeatOrders: 0 };
        if (isNewInPeriod(o, startDate)) {
          entry.newOrders++;
        } else {
          entry.repeatOrders++;
        }
        dailyOrdersMap.set(day, entry);
      });
    const dailyOrders = Array.from(dailyOrdersMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // Compute all additional data — pass periodStart for new/returning
    const customerMix = computeCustomerMix(currentOrders, startDate);
    const hourlyOrders = computeHourlyOrders(currentOrders);
    const geoData = computeGeoData(currentOrders);
    const shopifyCategories = computeCategories(currentOrders, products);
    const topProducts = computeTopProducts(currentOrders);
    const shopifyLTV = computeLTV(customers);
    const shopifyRepeatData = computeRepeatData(currentOrders, customers, startDate);
    const cohortData = computeCohortData(currentOrders);

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
      customerMix,
      hourlyOrders,
      geoData,
      shopifyCategories,
      shopifyLTV,
      shopifyRepeatData,
      cohortData,
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
