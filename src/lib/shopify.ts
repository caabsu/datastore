// Shopify Admin API client — REST (2024-01)
// Docs: https://shopify.dev/docs/api/admin-rest

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const ACCESS_TOKEN = process.env.SHOPIFY_CLIENT_SECRET!; // Shopify custom app admin token

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
  refunds: {
    id: number;
    created_at: string;
    refund_line_items: {
      quantity: number;
      subtotal: number;
      line_item_id: number;
    }[];
  }[];
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

export function computeShopifyKPIs(orders: ShopifyOrder[]) {
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

  const refundedOrders = orders.filter((o) => o.financial_status === "refunded").length;
  const refundRate = orders.length > 0 ? (refundedOrders / orders.length) * 100 : 0;

  const newCustomers = completed.filter(
    (o) => o.customer && o.customer.orders_count <= 1
  ).length;
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
