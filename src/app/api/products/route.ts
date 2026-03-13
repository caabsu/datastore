import { NextResponse } from "next/server";
import { getOrders, getProducts, computeProductAnalytics } from "@/lib/shopify";

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
      const days = parseInt(searchParams.get("days") ?? "28");
      now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - days);
    }

    const [orders, products] = await Promise.all([
      getOrders({
        created_at_min: startDate.toISOString(),
        created_at_max: now.toISOString(),
        status: "any",
      }),
      getProducts({ limit: 250 }),
    ]);

    // Build product inventory map
    const inventoryMap = new Map<
      number,
      { title: string; sku: string; inventory: number }
    >();
    products.forEach((p) => {
      const totalInv = p.variants.reduce(
        (s, v) => s + (v.inventory_quantity > 0 ? v.inventory_quantity : 0),
        0
      );
      inventoryMap.set(p.id, {
        title: p.title,
        sku: p.variants[0]?.sku || "",
        inventory: totalInv,
      });
    });

    // Compute product analytics with channel attribution & return rates
    const productAnalytics = computeProductAnalytics(orders);
    const rangeDays = Math.max(
      1,
      Math.round((now.getTime() - startDate.getTime()) / 86_400_000)
    );

    // Merge analytics with inventory data
    const productList = productAnalytics.map((p) => {
      const inv = inventoryMap.get(p.productId);
      const inventory = inv?.inventory ?? 0;
      const dailySellRate = rangeDays > 0 ? p.units / rangeDays : 0;
      const daysOfStock =
        dailySellRate > 0 ? Math.round(inventory / dailySellRate) : null;

      return {
        ...p,
        sku: p.sku || inv?.sku || "",
        inventory,
        dailySellRate: +dailySellRate.toFixed(2),
        daysOfStock,
      };
    });

    // Compute channel summary across all products
    const channelTotals = new Map<
      string,
      { revenue: number; units: number; orders: number }
    >();
    productAnalytics.forEach((p) => {
      p.channels.forEach((ch) => {
        const existing = channelTotals.get(ch.channel) ?? {
          revenue: 0,
          units: 0,
          orders: 0,
        };
        existing.revenue += ch.revenue;
        existing.units += ch.units;
        existing.orders += ch.orders;
        channelTotals.set(ch.channel, existing);
      });
    });

    const totalRevenue = productAnalytics.reduce((s, p) => s + p.revenue, 0);
    const channelSummary = Array.from(channelTotals.entries())
      .map(([channel, d]) => ({
        channel,
        revenue: +d.revenue.toFixed(2),
        units: d.units,
        orders: d.orders,
        pct: totalRevenue > 0 ? +(d.revenue / totalRevenue * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ products: productList, channelSummary });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Products API error",
      },
      { status: 500 }
    );
  }
}
