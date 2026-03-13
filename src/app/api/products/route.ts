import { NextResponse } from "next/server";
import { getOrders, getProducts } from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "28");

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);

    const [orders, products] = await Promise.all([
      getOrders({
        created_at_min: startDate.toISOString(),
        created_at_max: now.toISOString(),
        status: "any",
      }),
      getProducts({ limit: 250 }),
    ]);

    const completed = orders.filter(
      (o) =>
        o.financial_status === "paid" ||
        o.financial_status === "partially_refunded"
    );

    // Build product inventory map from products
    const inventoryMap = new Map<
      number,
      { title: string; sku: string; inventory: number }
    >();
    products.forEach((p) => {
      const totalInv = p.variants.reduce(
        (s, v) => s + (v.inventory_quantity > 0 ? v.inventory_quantity : 0),
        0
      );
      const firstSku = p.variants[0]?.sku || "";
      inventoryMap.set(p.id, {
        title: p.title,
        sku: firstSku,
        inventory: totalInv,
      });
    });

    // Aggregate by product from order line items
    const productMap = new Map<
      number,
      { name: string; sku: string; revenue: number; units: number }
    >();

    completed.forEach((o) => {
      o.line_items.forEach((li) => {
        const entry = productMap.get(li.product_id) ?? {
          name: li.title,
          sku: li.sku || "",
          revenue: 0,
          units: 0,
        };
        entry.revenue += parseFloat(li.price) * li.quantity;
        entry.units += li.quantity;
        if (!entry.sku && li.sku) entry.sku = li.sku;
        productMap.set(li.product_id, entry);
      });
    });

    const productList = Array.from(productMap.entries())
      .map(([productId, data]) => {
        const inv = inventoryMap.get(productId);
        const inventory = inv?.inventory ?? 0;
        const dailySellRate = days > 0 ? data.units / days : 0;
        const daysOfStock =
          dailySellRate > 0 ? Math.round(inventory / dailySellRate) : null;

        return {
          productId,
          name: data.name,
          sku: data.sku || inv?.sku || "",
          revenue: +data.revenue.toFixed(2),
          units: data.units,
          aov: data.units > 0 ? +(data.revenue / data.units).toFixed(2) : 0,
          inventory,
          dailySellRate: +dailySellRate.toFixed(2),
          daysOfStock,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return NextResponse.json({ products: productList });
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
