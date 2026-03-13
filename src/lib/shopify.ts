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
  referring_site: string | null;
  landing_site: string | null;
  source_name: string;
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
  updated_at_min?: string;
  updated_at_max?: string;
  limit?: number;
}): Promise<ShopifyOrder[]> {
  const perPage = Math.min(params?.limit ?? 250, 250);
  const queryParams: Record<string, string> = {
    status: params?.status ?? "any",
    limit: String(perPage),
  };
  if (params?.created_at_min) queryParams.created_at_min = params.created_at_min;
  if (params?.created_at_max) queryParams.created_at_max = params.created_at_max;
  if (params?.updated_at_min) queryParams.updated_at_min = params.updated_at_min;
  if (params?.updated_at_max) queryParams.updated_at_max = params.updated_at_max;

  const allOrders: ShopifyOrder[] = [];
  const firstUrl = new URL(`${BASE}/orders.json`);
  Object.entries(queryParams).forEach(([k, v]) => firstUrl.searchParams.set(k, v));

  let nextUrl: string | null = firstUrl.toString();
  const MAX_PAGES = 20; // safety limit ~5000 orders

  for (let page = 0; page < MAX_PAGES && nextUrl; page++) {
    // Retry with backoff on rate limit (429)
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(nextUrl, {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        cache: "no-store", // ensure fresh response with Link headers
      });

      if (res.status === 429) {
        // Shopify rate limit — wait and retry
        const retryAfter = parseFloat(res.headers.get("Retry-After") ?? "2");
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      const text = await res?.text().catch(() => "Unknown error");
      throw new Error(`Shopify API ${res?.status}: ${text}`);
    }

    const data = (await res.json()) as { orders: ShopifyOrder[] };
    allOrders.push(...data.orders);

    // Stop if we got fewer than the page size (no more pages)
    if (data.orders.length < perPage) break;

    // Follow cursor-based pagination via Link header
    const linkHeader: string | null = res.headers.get("link");
    const nextMatch: RegExpMatchArray | null | undefined = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    nextUrl = nextMatch ? nextMatch[1] : null;
  }

  return allOrders;
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
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + (rl.subtotal > 0 ? rl.subtotal : 0), 0),
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

  // Track unique customers (not order count) for percentages
  const uniqueCustomers = new Map<number, boolean>(); // customerId -> isNew
  let newRevenue = 0;
  let returningRevenue = 0;

  completed.forEach((o) => {
    const revenue = parseFloat(o.subtotal_price);
    const isNew = isNewCustomerInPeriod(o, start);

    if (o.customer && !uniqueCustomers.has(o.customer.id)) {
      uniqueCustomers.set(o.customer.id, isNew);
    }

    if (isNew) {
      newRevenue += revenue;
    } else {
      returningRevenue += revenue;
    }
  });

  // Percentages based on unique customers
  const newCount = Array.from(uniqueCustomers.values()).filter((v) => v).length;
  const returningCount = uniqueCustomers.size - newCount;
  const total = uniqueCustomers.size;
  const newPct = total > 0 ? (newCount / total) * 100 : 0;
  const returningPct = total > 0 ? (returningCount / total) * 100 : 0;

  // Daily breakdown — count unique customers per day (dedupe within day)
  const dailyMap = new Map<string, { newCusts: Set<number>; retCusts: Set<number> }>();
  completed.forEach((o) => {
    if (!o.customer) return;
    const day = o.created_at.substring(0, 10);
    const entry = dailyMap.get(day) ?? { newCusts: new Set(), retCusts: new Set() };
    if (isNewCustomerInPeriod(o, start)) {
      entry.newCusts.add(o.customer.id);
    } else {
      entry.retCusts.add(o.customer.id);
    }
    dailyMap.set(day, entry);
  });

  const data = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sets]) => ({
      date,
      new: sets.newCusts.size,
      returning: sets.retCusts.size,
    }));

  return {
    newPct: Math.round(newPct * 10) / 10,
    returningPct: Math.round(returningPct * 10) / 10,
    newRevenue: Math.round(newRevenue * 100) / 100,
    returningRevenue: Math.round(returningRevenue * 100) / 100,
    newCustomers: newCount,
    returningCustomers: returningCount,
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
// Only customers with net positive revenue (actual purchases kept) count.
// Revenue = gross order subtotals minus refund amounts.
export function computeLTV(orders: ShopifyOrder[]) {
  // Include paid, partially_refunded, AND refunded to capture full picture
  const relevantOrders = orders.filter(
    (o) =>
      !o.cancelled_at &&
      (o.financial_status === "paid" ||
        o.financial_status === "partially_refunded" ||
        o.financial_status === "refunded")
  );

  // Build per-customer NET revenue (gross - refunds)
  const customerMap = new Map<
    number,
    { grossRevenue: number; refundAmount: number; orders_count: number; created_at: string }
  >();

  relevantOrders.forEach((o) => {
    if (!o.customer) return;
    const custId = o.customer.id;
    const gross = parseFloat(o.subtotal_price);
    const refunds = o.refunds.reduce(
      (rs, r) =>
        rs + r.refund_line_items.reduce((rls, rl) => rls + (rl.subtotal > 0 ? rl.subtotal : 0), 0),
      0
    );

    const existing = customerMap.get(custId);
    if (existing) {
      existing.grossRevenue += gross;
      existing.refundAmount += refunds;
    } else {
      customerMap.set(custId, {
        grossRevenue: gross,
        refundAmount: refunds,
        orders_count: o.customer.orders_count,
        created_at: o.customer.created_at,
      });
    }
  });

  // Only count customers with net positive revenue — they actually purchased
  const payingCustomers = Array.from(customerMap.values()).filter(
    (c) => c.grossRevenue - c.refundAmount > 0
  );

  if (payingCustomers.length === 0) {
    return {
      overall: 0,
      new30d: 0,
      returning: 0,
      byChannel: [] as { channel: string; ltv: number; cacRatio: number }[],
    };
  }

  const netRevenue = (c: (typeof payingCustomers)[0]) =>
    c.grossRevenue - c.refundAmount;

  const overall =
    payingCustomers.reduce((s, c) => s + netRevenue(c), 0) /
    payingCustomers.length;

  // New customers: created in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = payingCustomers.filter((c) => {
    try {
      return new Date(c.created_at) >= thirtyDaysAgo;
    } catch {
      return false;
    }
  });
  const new30d =
    newCustomers.length > 0
      ? newCustomers.reduce((s, c) => s + netRevenue(c), 0) /
        newCustomers.length
      : 0;

  // Returning customers: lifetime orders_count > 1
  const returningCustomers = payingCustomers.filter(
    (c) => c.orders_count > 1
  );
  const returning =
    returningCustomers.length > 0
      ? returningCustomers.reduce((s, c) => s + netRevenue(c), 0) /
        returningCustomers.length
      : 0;

  return {
    overall: Math.round(overall * 100) / 100,
    new30d: Math.round(new30d * 100) / 100,
    returning: Math.round(returning * 100) / 100,
    byChannel: [] as { channel: string; ltv: number; cacRatio: number }[],
  };
}

// ── Repeat Purchase Stats ──
// Derived entirely from order data — no separate customer list needed
export function computeRepeatData(
  orders: ShopifyOrder[],
  periodStart?: Date
) {
  const completed = orders.filter(
    (o) => o.financial_status === "paid" || o.financial_status === "partially_refunded"
  );

  // Build per-customer stats from orders in the period
  const customerMap = new Map<
    number,
    { periodOrders: number; lifetimeCount: number; revenue: number; isNew: boolean }
  >();

  const start = periodStart ?? new Date(0);

  completed.forEach((o) => {
    if (!o.customer) return;
    const custId = o.customer.id;
    const existing = customerMap.get(custId);
    if (existing) {
      existing.periodOrders++;
      existing.revenue += parseFloat(o.subtotal_price);
    } else {
      customerMap.set(custId, {
        periodOrders: 1,
        lifetimeCount: o.customer.orders_count, // Shopify lifetime orders_count
        revenue: parseFloat(o.subtotal_price),
        isNew: isNewCustomerInPeriod(o, start),
      });
    }
  });

  const uniqueCustomers = customerMap.size;
  // A "repeat" customer has placed more than 1 lifetime order (from Shopify's orders_count)
  const repeatCustomers = Array.from(customerMap.values()).filter(
    (c) => c.lifetimeCount > 1
  ).length;
  const repeatRate =
    uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

  // Average orders per customer within the period
  const avgOrdersPerCustomer =
    uniqueCustomers > 0 ? completed.length / uniqueCustomers : 0;

  // Repeat revenue: revenue from returning (non-new) customers
  const totalRevenue = completed.reduce(
    (s, o) => s + parseFloat(o.subtotal_price),
    0
  );
  const returningRevenue = Array.from(customerMap.values())
    .filter((c) => !c.isNew)
    .reduce((s, c) => s + c.revenue, 0);
  const repeatRevenuePct =
    totalRevenue > 0 ? (returningRevenue / totalRevenue) * 100 : 0;

  return {
    repeatRate: Math.round(repeatRate * 10) / 10,
    avgTimeBetween: null as number | null,
    avgOrdersPerCustomer: Math.round(avgOrdersPerCustomer * 100) / 100,
    repeatRevenuePct: Math.round(repeatRevenuePct * 10) / 10,
  };
}

// ── Cohort Retention ──
// Group customers by their first purchase month in the data window,
// then track which subsequent months they returned to purchase again.
export function computeCohortData(orders: ShopifyOrder[]) {
  // Include all non-cancelled orders for activity tracking (refunded orders were still purchases)
  const validOrders = orders.filter((o) => !o.cancelled_at);

  // Sort by date so first encounter = first order
  const sorted = [...validOrders].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  // Build customer map: first order month = cohort assignment
  const customerMap = new Map<
    number,
    { cohortMonth: string; orderMonths: Set<string> }
  >();

  sorted.forEach((o) => {
    if (!o.customer) return;
    const custId = o.customer.id;
    const orderMonth = o.created_at.substring(0, 7); // YYYY-MM

    if (!customerMap.has(custId)) {
      customerMap.set(custId, {
        cohortMonth: orderMonth, // first order in our data = cohort
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
    if (!cohortMap.has(data.cohortMonth)) {
      cohortMap.set(data.cohortMonth, {
        customers: new Set(),
        monthlyActive: new Map(),
      });
    }
    const cohort = cohortMap.get(data.cohortMonth)!;
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

// ── Channel Attribution ──
// Derive traffic channel from UTM params, referrer, and source_name
export function deriveChannel(order: ShopifyOrder): string {
  const landing = order.landing_site ?? "";
  const referrer = (order.referring_site ?? "").toLowerCase();

  // Parse UTM params from landing_site (most reliable signal)
  try {
    const url = new URL(landing, "https://placeholder.com");
    const utmSource = (url.searchParams.get("utm_source") ?? "").toLowerCase();
    const utmMedium = (url.searchParams.get("utm_medium") ?? "").toLowerCase();

    if (
      utmSource.includes("facebook") || utmSource.includes("fb") ||
      utmSource.includes("instagram") || utmSource.includes("ig") ||
      utmSource.includes("meta")
    ) {
      return (utmMedium.includes("paid") || utmMedium.includes("cpc") || utmMedium.includes("cpm"))
        ? "Meta Ads" : "Meta Organic";
    }
    if (utmSource.includes("google")) {
      return (utmMedium.includes("cpc") || utmMedium.includes("paid"))
        ? "Google Ads" : "Google Organic";
    }
    if (
      utmSource.includes("email") || utmSource.includes("klaviyo") ||
      utmSource.includes("mailchimp") || utmSource.includes("omnisend") ||
      utmMedium === "email"
    ) {
      return "Email";
    }
    if (utmSource.includes("tiktok") || utmSource.includes("tt")) return "TikTok";
    if (utmSource) return "Other";
  } catch {
    // landing_site might not be a parseable URL
  }

  // Fall back to referring_site
  if (referrer.includes("facebook.com") || referrer.includes("instagram.com") || referrer.includes("fb.com")) {
    return "Meta Organic";
  }
  if (referrer.includes("google.com") || referrer.includes("google.co")) {
    return "Google Organic";
  }
  if (referrer.includes("bing.com") || referrer.includes("yahoo.com") || referrer.includes("duckduckgo")) {
    return "Search";
  }
  if (referrer.includes("tiktok.com")) return "TikTok";
  if (referrer) return "Other";

  return "Direct";
}

// ── Product Analytics with Channel Attribution ──
export function computeProductAnalytics(orders: ShopifyOrder[]) {
  const validOrders = orders.filter((o) => !o.cancelled_at);

  const productMap = new Map<
    number,
    {
      name: string;
      sku: string;
      revenue: number;
      units: number;
      orderCount: number;
      refundedUnits: number;
      refundAmount: number;
      channels: Map<string, { revenue: number; units: number; orders: number }>;
      customers: Set<number>;
    }
  >();

  validOrders.forEach((o) => {
    const channel = deriveChannel(o);
    const lineItemMap = new Map<number, (typeof o.line_items)[0]>();
    o.line_items.forEach((li) => lineItemMap.set(li.id, li));

    // Aggregate line items by product
    o.line_items.forEach((li) => {
      const entry = productMap.get(li.product_id) ?? {
        name: li.title,
        sku: li.sku || "",
        revenue: 0,
        units: 0,
        orderCount: 0,
        refundedUnits: 0,
        refundAmount: 0,
        channels: new Map(),
        customers: new Set(),
      };

      const lineRevenue = parseFloat(li.price) * li.quantity;
      entry.revenue += lineRevenue;
      entry.units += li.quantity;
      entry.orderCount++;
      if (o.customer) entry.customers.add(o.customer.id);
      if (!entry.sku && li.sku) entry.sku = li.sku;

      // Channel attribution
      const ch = entry.channels.get(channel) ?? { revenue: 0, units: 0, orders: 0 };
      ch.revenue += lineRevenue;
      ch.units += li.quantity;
      ch.orders++;
      entry.channels.set(channel, ch);

      productMap.set(li.product_id, entry);
    });

    // Track refunds per product — exclude zero-dollar refunds
    o.refunds.forEach((r) => {
      r.refund_line_items.forEach((rli) => {
        if (rli.subtotal <= 0) return; // skip zero-dollar / non-monetary returns
        const li = lineItemMap.get(rli.line_item_id);
        if (!li) return;
        const entry = productMap.get(li.product_id);
        if (!entry) return;
        entry.refundedUnits += rli.quantity;
        entry.refundAmount += rli.subtotal;
      });
    });
  });

  return Array.from(productMap.entries())
    .map(([productId, d]) => ({
      productId,
      name: d.name,
      sku: d.sku,
      revenue: +d.revenue.toFixed(2),
      units: d.units,
      orders: d.orderCount,
      aov: d.units > 0 ? +(d.revenue / d.units).toFixed(2) : 0,
      refundedUnits: d.refundedUnits,
      refundAmount: +d.refundAmount.toFixed(2),
      returnRate: d.units > 0 ? +(d.refundedUnits / d.units * 100).toFixed(1) : 0,
      uniqueCustomers: d.customers.size,
      channels: Array.from(d.channels.entries())
        .map(([channel, ch]) => ({
          channel,
          revenue: +ch.revenue.toFixed(2),
          units: ch.units,
          orders: ch.orders,
          pct: d.revenue > 0 ? +(ch.revenue / d.revenue * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ── Returns & Refund Analytics ──

export function computeReturnsAnalytics(orders: ShopifyOrder[]) {
  // Only count orders with monetary refunds (exclude zero-dollar returns)
  const refundedOrders = orders.filter((o) =>
    o.refunds.some((r) => r.refund_line_items.some((rl) => rl.subtotal > 0))
  );

  const totalRefundAmount = refundedOrders.reduce(
    (sum, o) =>
      sum +
      o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + (rl.subtotal > 0 ? rl.subtotal : 0), 0),
        0
      ),
    0
  );

  const totalRefundedUnits = refundedOrders.reduce(
    (sum, o) =>
      sum +
      o.refunds.reduce(
        (rs, r) => rs + r.refund_line_items.reduce((rls, rl) => rls + (rl.subtotal > 0 ? rl.quantity : 0), 0),
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
