// Types matching the Supabase database schema

export interface Merchant {
  id: string;
  shop_domain: string;
  shop_name: string | null;
  shop_email: string | null;
  access_token: string;
  currency: string;
  status: string;
  subscription_status: string;
  markup_mode: string;
  markup_value: number;
  installed_at: string;
  uninstalled_at: string | null;
  updated_at: string;
}

export interface ProductTemplate {
  id: string;
  merchant_id: string;
  code: string;
  name: string;
  sku: string | null;
  category: "blind" | "curtain" | "shutter" | "awning";
  algorithm_code: string | null;
  pricing_model: "area" | "grid" | "sqm" | "linear_metre" | "fixed";
  min_width: number;
  max_width: number;
  min_drop: number;
  max_drop: number;
  min_depth: number | null;
  max_depth: number | null;
  min_diameter: number | null;
  max_diameter: number | null;
  default_deductions: Record<string, unknown> | null;
  options: Record<string, unknown> | null;
  dimension_fields: Record<string, unknown> | null;
  labels: Record<string, unknown> | null;
  default_grid_id: string | null;
  vendor_id: string | null;
  pricing_formula: string | null;
  pricing_defaults: Record<string, unknown> | null;
  wastage_percent: number;
  pack_size: number | null;
  pack_unit: string | null;
  labour_cost: number;
  installation_cost: number;
  created_at: string;
}

export interface Vendor {
  id: string;
  merchant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  region: string | null;
  notes: string | null;
  created_at: string;
}

export interface Fabric {
  id: string;
  merchant_id: string;
  name: string;
  category: string;
  colours: string[];
  roll_width: number;
  price_per_sqm: number;
  price_per_linear_metre: number;
  surcharge: number;
  created_at: string;
}

export interface PricingGrid {
  id: string;
  merchant_id: string;
  product_template_id: string;
  fabric_id: string | null;
  width_bands: number[];
  drop_bands: number[];
  prices: number[];
  roll_width: number | null;
  price_per_linear_metre: number | null;
  price_per_sqm: number | null;
  pattern_repeat: number | null;
  created_at: string;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export interface QuoteLineItem {
  template_code: string;
  template_name: string;
  width: number;
  drop: number;
  fabric: string | null;
  colour: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Quote {
  id: string;
  merchant_id: string;
  quote_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  region: string | null;
  line_items: QuoteLineItem[];
  total_ex_tax: number;
  total_tax: number;
  total_inc_tax: number;
  status: QuoteStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export type WorkOrderStatus = "pending" | "in_production" | "completed" | "shipped";

export interface WorkOrderItem {
  template_name: string;
  width: number;
  drop: number;
  fabric: string | null;
  colour: string | null;
  quantity: number;
}

export interface WorkOrder {
  id: string;
  merchant_id: string;
  quote_id: string | null;
  order_id: string | null;
  status: WorkOrderStatus;
  items: WorkOrderItem[];
  vendor_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string | null;
  product_type: string | null;
  status: string;
  image: { src: string; alt: string | null } | null;
  template_id: string | null;
}
