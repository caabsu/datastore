// Shopify Admin API client — REST (2024-01)
// Docs: https://shopify.dev/docs/api/admin-rest

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

const API_VERSION = "2024-01";
const BASE = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}`;

async function shopifyFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${endpoint}.json`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──

export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  total_tax: string;
  currency: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    orders_count: number;
    created_at: string;
  } | null;
  line_items: {
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
    product_id: number;
    variant_id: number;
  }[];
  shipping_address: {
    province: string | null;
    province_code: string | null;
    country: string | null;
    country_code: string | null;
  } | null;
  refunds: {
    id: number;
    created_at: string;
    note: string | null;
    refund_line_items: {
      quantity: number;
      subtotal: number;
      line_item_id: number;
    }[];
  }[];
}

export interface ShopifyDispute {
  id: number;
  type: string;
  amount: string;
  currency: string;
  reason: string;
  status: string;
  evidence_due_by: string;
  finalized_on: string | null;
  initiated_at: string;
  network_reason_code: string;
  order_id: number | null;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  status: string;
  variants: {
    id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }[];
  images: { src: string }[];
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  created_at: string;
  tags: string;
}

// ── API Methods ──

export async function getDisputes(): Promise<ShopifyDispute[]> {
  try {
    const data = await shopifyFetch<{ disputes: ShopifyDispute[] }>(
      "/shopify_payments/disputes"
    );
    return data.disputes;
  } catch {
    // Not available for all payment gateways
    return [];
  }
}

export async function getOrders(params?: {
  status?: string;
  created_at_min?: string;
  created_at_max?: string;
  limit?: number;
}): Promise<ShopifyOrder[]> {
  const queryParams: Record<string, string> = {
    status: params?.status ?? "any",
    limit: String(params?.limit ?? 250),
  };
  if (params?.created_at_min) queryParams.created_at_min = params.created_at_min;
  if (params?.created_at_max) queryParams.created_at_max = params.created_at_max;

  const data = await shopifyFetch<{ orders: ShopifyOrder[] }>("/orders", queryParams);
  return data.orders;
}

export async function getOrdersCount(params?: {
  status?: string;
  created_at_min?: string;
  created_at_max?: string;
}): Promise<number> {
  const queryParams: Record<string, string> = {
    status: params?.status ?? "any",
  };
  if (params?.created_at_min) queryParams.created_at_min = params.created_at_min;
  if (params?.created_at_max) queryParams.created_at_max = params.created_at_max;

  const data = await shopifyFetch<{ count: number }>("/orders/count", queryParams);
  return data.count;
}

export async function getProducts(params?: {
  limit?: number;
  status?: string;
}): Promise<ShopifyProduct[]> {
  const queryParams: Record<string, string> = {
    limit: String(params?.limit ?? 250),
    status: params?.status ?? "active",
  };

  const data = await shopifyFetch<{ products: ShopifyProduct[] }>("/products", queryParams);
  return data.products;
}

export async function getCustomers(params?: {
  limit?: number;
  created_at_min?: string;
}): Promise<ShopifyCustomer[]> {
  const queryParams: Record<string, string> = {
    limit: String(params?.limit ?? 250),
  };
  if (params?.created_at_min) queryParams.created_at_min = params.created_at_min;

  const data = await shopifyFetch<{ customers: ShopifyCustomer[] }>("/customers", queryParams);
  return data.customers;
}

// ── Computed Metrics ──

/**
 * Determine if a customer is "new" during the query period.
 * A customer is new if their account was created within the period
 * (i.e., their first order triggered account creation during this window).
 */
function isNewCustomerInPeriod(
  order: ShopifyOrder,
  periodStart: Date
): boolean {
  if (!order.customer) return false;
  try {
    const customerCreated = new Date(order.customer.created_at);
    return customerCreated >= periodStart;
  } catch {
    return false;
  }
}

export function computeShopifyKPIs(orders: ShopifyOrder[], periodStart?: Date) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  const totalRevenue = completed.reduce((s, o) => s + parseFloat(o.subtotal_price), 0);
  const totalRefunds = completed.reduce(
    (s, o) =>
      s +
      o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + rl.subtotal, 0),
        0
      ),
    0
  );
  const netRevenue = totalRevenue - totalRefunds;
  const totalOrders = completed.length;
  const aov = totalOrders > 0 ? netRevenue / totalOrders : 0;

  const totalUnits = completed.reduce(
    (s, o) => s + o.line_items.reduce((ls, li) => ls + li.quantity, 0),
    0
  );
  const unitsPerOrder = totalOrders > 0 ? totalUnits / totalOrders : 0;

  // Refund rate: count orders with any refund activity (not just fully refunded)
  const refundedOrders = orders.filter(
    (o) => o.financial_status === "refunded" || o.financial_status === "partially_refunded"
  ).length;
  const refundRate = orders.length > 0 ? (refundedOrders / orders.length) * 100 : 0;

  // New vs returning: compare customer.created_at against period start
  const start = periodStart ?? new Date(0);
  const newCustomers = completed.filter((o) => isNewCustomerInPeriod(o, start)).length;
  const newCustomerPct = totalOrders > 0 ? (newCustomers / totalOrders) * 100 : 0;

  return {
    netRevenue,
    totalRevenue,
    totalRefunds,
    totalOrders,
    aov,
    unitsPerOrder,
    refundRate,
    newCustomers,
    returningCustomers: totalOrders - newCustomers,
    newCustomerPct,
  };
}

// ── Customer Mix ──
// Returns new vs returning breakdown with percentages, revenue, and daily split
// Uses customer.created_at vs periodStart to determine new vs returning
export function computeCustomerMix(orders: ShopifyOrder[], periodStart?: Date) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  const start = periodStart ?? new Date(0);

  let newRevenue = 0;
  let returningRevenue = 0;
  let newCount = 0;
  let returningCount = 0;

  completed.forEach((o) => {
    const revenue = parseFloat(o.subtotal_price);
    if (isNewCustomerInPeriod(o, start)) {
      newRevenue += revenue;
      newCount++;
    } else {
      returningRevenue += revenue;
      returningCount++;
    }
  });

  const total = newCount + returningCount;
  const newPct = total > 0 ? (newCount / total) * 100 : 0;
  const returningPct = total > 0 ? (returningCount / total) * 100 : 0;

  // Daily breakdown for stacked area chart
  const dailyMap = new Map<string, { new: number; returning: number }>();
  completed.forEach((o) => {
    const day = o.created_at.substring(0, 10);
    const entry = dailyMap.get(day) ?? { new: 0, returning: 0 };
    if (isNewCustomerInPeriod(o, start)) {
      entry.new++;
    } else {
      entry.returning++;
    }
    dailyMap.set(day, entry);
  });

  const data = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      const dayTotal = counts.new + counts.returning;
      return {
        date,
        new: dayTotal > 0 ? Math.round((counts.new / dayTotal) * 100) : 0,
        returning: dayTotal > 0 ? Math.round((counts.returning / dayTotal) * 100) : 0,
      };
    });

  return {
    newPct: Math.round(newPct * 10) / 10,
    returningPct: Math.round(returningPct * 10) / 10,
    newRevenue: Math.round(newRevenue * 100) / 100,
    returningRevenue: Math.round(returningRevenue * 100) / 100,
    data,
  };
}

// ── Hourly Orders ──
// Buckets orders by hour (0-23) from created_at
export function computeHourlyOrders(orders: ShopifyOrder[]) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  const hourBuckets = new Array(24).fill(0);
  completed.forEach((o) => {
    try {
      const hour = new Date(o.created_at).getUTCHours();
      hourBuckets[hour]++;
    } catch {
      // skip malformed dates
    }
  });

  return hourBuckets.map((count, h) => ({
    hour: `${h}:00`,
    orders: count,
  }));
}

// ── Geo Data ──
// Top states by order count from shipping_address.province or province_code
export function computeGeoData(orders: ShopifyOrder[]) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  const stateMap = new Map<string, { orders: number; revenue: number }>();
  completed.forEach((o) => {
    const state =
      o.shipping_address?.province_code ||
      o.shipping_address?.province ||
      null;
    if (!state) return;
    const entry = stateMap.get(state) ?? { orders: 0, revenue: 0 };
    entry.orders++;
    entry.revenue += parseFloat(o.subtotal_price);
    stateMap.set(state, entry);
  });

  return Array.from(stateMap.entries())
    .map(([state, data]) => ({
      state,
      orders: data.orders,
      revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);
}

// ── Product Categories ──
// Group line items by product_type (from products map) or title prefix
export function computeCategories(
  orders: ShopifyOrder[],
  products: ShopifyProduct[]
) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  // Build a product_id -> product_type lookup
  const productTypeMap = new Map<number, string>();
  products.forEach((p) => {
    const pType = p.product_type?.trim() || "Other";
    productTypeMap.set(p.id, pType);
  });

  const catMap = new Map<
    string,
    { revenue: number; units: number; orders: Set<number> }
  >();

  completed.forEach((o) => {
    o.line_items.forEach((li) => {
      const category = productTypeMap.get(li.product_id) || "Other";
      const entry = catMap.get(category) ?? {
        revenue: 0,
        units: 0,
        orders: new Set<number>(),
      };
      entry.revenue += parseFloat(li.price) * li.quantity;
      entry.units += li.quantity;
      entry.orders.add(o.id);
      catMap.set(category, entry);
    });
  });

  const totalRevenue = Array.from(catMap.values()).reduce(
    (s, c) => s + c.revenue,
    0
  );

  return Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      revenue: Math.round(data.revenue * 100) / 100,
      units: data.units,
      aov: data.units > 0 ? Math.round((data.revenue / data.units) * 100) / 100 : 0,
      pct:
        totalRevenue > 0
          ? Math.round((data.revenue / totalRevenue) * 1000) / 10
          : 0,
      change: 0, // no previous period product data for comparison
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ── Top Products (expanded) ──
// Includes sku field and change placeholder
export function computeTopProducts(orders: ShopifyOrder[]) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  const productMap = new Map<
    string,
    { revenue: number; units: number; sku: string }
  >();
  completed.forEach((o) => {
    o.line_items.forEach((li) => {
      const key = li.title;
      const entry = productMap.get(key) ?? { revenue: 0, units: 0, sku: "" };
      entry.revenue += parseFloat(li.price) * li.quantity;
      entry.units += li.quantity;
      // Use the first non-empty sku encountered
      if (!entry.sku && li.sku) entry.sku = li.sku;
      productMap.set(key, entry);
    });
  });

  return Array.from(productMap.entries())
    .map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      units: data.units,
      aov: data.units > 0 ? Math.round((data.revenue / data.units) * 100) / 100 : 0,
      sku: data.sku || null,
      change: 0, // no previous period product data for comparison
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

// ── Customer Lifetime Value ──
// Compute overall, new30d, and returning LTV from customer data
export function computeLTV(customers: ShopifyCustomer[]) {
  if (customers.length === 0) {
    return {
      overall: 0,
      new30d: 0,
      returning: 0,
      byChannel: [] as { channel: string; ltv: number; cacRatio: number }[],
    };
  }

  const totalSpent = customers.reduce(
    (s, c) => s + parseFloat(c.total_spent || "0"),
    0
  );
  const overall = totalSpent / customers.length;

  // New customers: created in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter((c) => {
    try {
      return new Date(c.created_at) >= thirtyDaysAgo;
    } catch {
      return false;
    }
  });
  const new30dSpent = newCustomers.reduce(
    (s, c) => s + parseFloat(c.total_spent || "0"),
    0
  );
  const new30d = newCustomers.length > 0 ? new30dSpent / newCustomers.length : 0;

  // Returning customers: orders_count > 1
  const returningCustomers = customers.filter((c) => c.orders_count > 1);
  const returningSpent = returningCustomers.reduce(
    (s, c) => s + parseFloat(c.total_spent || "0"),
    0
  );
  const returning =
    returningCustomers.length > 0
      ? returningSpent / returningCustomers.length
      : 0;

  return {
    overall: Math.round(overall * 100) / 100,
    new30d: Math.round(new30d * 100) / 100,
    returning: Math.round(returning * 100) / 100,
    byChannel: [] as { channel: string; ltv: number; cacRatio: number }[],
  };
}

// ── Repeat Purchase Stats ──
// repeatRate, avgOrdersPerCustomer, repeatRevenuePct from orders + customers
export function computeRepeatData(
  orders: ShopifyOrder[],
  customers: ShopifyCustomer[],
  periodStart?: Date
) {
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter((c) => c.orders_count > 1);
  const repeatRate =
    totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0;

  const avgOrdersPerCustomer =
    totalCustomers > 0
      ? customers.reduce((s, c) => s + c.orders_count, 0) / totalCustomers
      : 0;

  // Compute repeat revenue % from orders using customer.created_at
  const start = periodStart ?? new Date(0);
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );
  const totalRevenue = completed.reduce(
    (s, o) => s + parseFloat(o.subtotal_price),
    0
  );
  const returningRevenue = completed
    .filter((o) => !isNewCustomerInPeriod(o, start))
    .reduce((s, o) => s + parseFloat(o.subtotal_price), 0);
  const repeatRevenuePct =
    totalRevenue > 0 ? (returningRevenue / totalRevenue) * 100 : 0;

  return {
    repeatRate: Math.round(repeatRate * 10) / 10,
    avgTimeBetween: null as number | null, // not easily available from API
    avgOrdersPerCustomer:
      Math.round(avgOrdersPerCustomer * 100) / 100,
    repeatRevenuePct: Math.round(repeatRevenuePct * 10) / 10,
  };
}

// ── Cohort Retention ──
// Group customers by creation month, then check which subsequent months they ordered in
export function computeCohortData(orders: ShopifyOrder[]) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  // Build a map: customerId -> { createdMonth, orderMonths[] }
  const customerMap = new Map<
    number,
    { createdMonth: string; orderMonths: Set<string> }
  >();

  completed.forEach((o) => {
    if (!o.customer) return;
    const custId = o.customer.id;
    const orderMonth = o.created_at.substring(0, 7); // YYYY-MM

    if (!customerMap.has(custId)) {
      // Use customer.created_at to determine cohort month
      const createdMonth = o.customer.created_at
        ? o.customer.created_at.substring(0, 7)
        : orderMonth;
      customerMap.set(custId, {
        createdMonth,
        orderMonths: new Set<string>(),
      });
    }
    customerMap.get(custId)!.orderMonths.add(orderMonth);
  });

  // Group customers by cohort month
  const cohortMap = new Map<
    string,
    { customers: Set<number>; monthlyActive: Map<string, Set<number>> }
  >();

  customerMap.forEach((data, custId) => {
    if (!cohortMap.has(data.createdMonth)) {
      cohortMap.set(data.createdMonth, {
        customers: new Set(),
        monthlyActive: new Map(),
      });
    }
    const cohort = cohortMap.get(data.createdMonth)!;
    cohort.customers.add(custId);
    data.orderMonths.forEach((month) => {
      if (!cohort.monthlyActive.has(month)) {
        cohort.monthlyActive.set(month, new Set());
      }
      cohort.monthlyActive.get(month)!.add(custId);
    });
  });

  // Convert to sorted array of cohorts, compute retention %
  const sortedCohorts = Array.from(cohortMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6); // last 6 months

  // Helper: get month offset from base YYYY-MM
  function addMonths(base: string, offset: number): string {
    const [y, m] = base.split("-").map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return sortedCohorts.map(([cohortMonth, data]) => {
    const size = data.customers.size;
    // Format cohort label like "Jan 2026"
    const [y, m] = cohortMonth.split("-").map(Number);
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const cohortLabel = `${monthNames[m - 1]} ${y}`;

    // Compute M0..M5 retention
    const months: (number | null)[] = [];
    for (let i = 0; i < 6; i++) {
      const targetMonth = addMonths(cohortMonth, i);
      if (targetMonth > currentMonth) {
        months.push(null);
      } else {
        const activeInMonth = data.monthlyActive.get(targetMonth)?.size ?? 0;
        months.push(
          size > 0 ? Math.round((activeInMonth / size) * 1000) / 10 : 0
        );
      }
    }

    return {
      cohort: cohortLabel,
      size,
      m0: months[0],
      m1: months[1],
      m2: months[2],
      m3: months[3],
      m4: months[4],
      m5: months[5],
    };
  });
}

// ── Returns & Refund Analytics ──

export function computeReturnsAnalytics(orders: ShopifyOrder[]) {
  const refundedOrders = orders.filter((o) => o.refunds.length > 0);

  const totalRefundAmount = refundedOrders.reduce(
    (sum, o) =>
      sum +
      o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + rl.subtotal, 0),
        0
      ),
    0
  );

  const totalRefundedUnits = refundedOrders.reduce(
    (sum, o) =>
      sum +
      o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + rl.quantity, 0),
        0
      ),
    0
  );

  const fullRefunds = orders.filter((o) => o.financial_status === "refunded").length;
  const partialRefunds = orders.filter(
    (o) => o.financial_status === "partially_refunded"
  ).length;

  const avgRefundValue =
    refundedOrders.length > 0 ? totalRefundAmount / refundedOrders.length : 0;

  return {
    totalRefundOrders: refundedOrders.length,
    totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
    totalRefundedUnits,
    fullRefunds,
    partialRefunds,
    avgRefundValue: Math.round(avgRefundValue * 100) / 100,
    refundRate:
      orders.length > 0
        ? Math.round((refundedOrders.length / orders.length) * 1000) / 10
        : 0,
  };
}

export function computeReturnsByProduct(orders: ShopifyOrder[]) {
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

  // Count total units sold per product
  orders
    .filter(
      (o) =>
        o.financial_status === "paid" || o.financial_status === "partially_refunded"
    )
    .forEach((o) => {
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
    });

  // Map refund line items to products
  orders
    .filter((o) => o.refunds.length > 0)
    .forEach((o) => {
      const lineItemMap = new Map<number, (typeof o.line_items)[0]>();
      o.line_items.forEach((li) => lineItemMap.set(li.id, li));

      o.refunds.forEach((r) => {
        r.refund_line_items.forEach((rli) => {
          const li = lineItemMap.get(rli.line_item_id);
          if (!li) return;
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
          entry.unitsReturned += rli.quantity;
          entry.refundAmount += rli.subtotal;
          if (!entry.orderNumbers.includes(o.name)) {
            entry.orderNumbers.push(o.name);
          }
          productMap.set(key, entry);
        });
      });
    });

  return Array.from(productMap.values())
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
}

/** Groups refunds by the ORDER date (when placed), not the refund date */
export function computeReturnTimeline(orders: ShopifyOrder[]) {
  const dailyMap = new Map<
    string,
    { refundedOrders: number; units: number; amount: number }
  >();

  orders.forEach((o) => {
    if (o.refunds.length === 0) return;
    const orderDate = o.created_at.substring(0, 10);
    const entry = dailyMap.get(orderDate) ?? {
      refundedOrders: 0,
      units: 0,
      amount: 0,
    };
    entry.refundedOrders++;
    o.refunds.forEach((r) => {
      r.refund_line_items.forEach((rli) => {
        entry.units += rli.quantity;
        entry.amount += rli.subtotal;
      });
    });
    dailyMap.set(orderDate, entry);
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      refundedOrders: d.refundedOrders,
      refundedUnits: d.units,
      refundAmount: Math.round(d.amount * 100) / 100,
    }));
}

/** Detailed list of every refunded order */
export function computeRefundedOrderDetails(orders: ShopifyOrder[]) {
  return orders
    .filter((o) => o.refunds.length > 0)
    .map((o) => {
      const refundTotal = o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + rl.subtotal, 0),
        0
      );
      const refundUnits = o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + rl.quantity, 0),
        0
      );
      const latestRefund = [...o.refunds].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )[0];

      // Map refund line items to product names
      const lineItemMap = new Map<number, string>();
      o.line_items.forEach((li) => lineItemMap.set(li.id, li.title));
      const refundedProducts = o.refunds.flatMap((r) =>
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
}

// ── Cancellation Analytics ──

export function computeCancellations(orders: ShopifyOrder[]) {
  const cancelled = orders.filter((o) => o.cancelled_at != null);

  const reasonMap = new Map<string, number>();
  cancelled.forEach((o) => {
    const reason = o.cancel_reason || "other";
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
  });

  const totalCancelledValue = cancelled.reduce(
    (s, o) => s + parseFloat(o.total_price),
    0
  );

  const reasons = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const details = cancelled
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
    .sort((a, b) => b.cancelledAt.localeCompare(a.cancelledAt));

  return {
    totalCancelled: cancelled.length,
    cancellationRate:
      orders.length > 0
        ? Math.round((cancelled.length / orders.length) * 1000) / 10
        : 0,
    totalCancelledValue: Math.round(totalCancelledValue * 100) / 100,
    reasons,
    details,
  };
}
