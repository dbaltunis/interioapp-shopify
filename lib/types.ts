// ── Merchant ──
export interface Merchant {
  id: string;
  shop_domain: string;
  access_token: string;
  status: "active" | "inactive";
  installed_at: string;
  updated_at: string;
}

// ── Template Options ──
export type OptionPriceType = "none" | "flat" | "multiplier" | "per_sqm" | "per_linear_metre";

export interface TemplateOptionChoice {
  value: string;
  label: string;
  price_type: OptionPriceType;
  price_value: number;
}

export interface TemplateOption {
  key: string;
  label: string;
  type: "select" | "radio" | "checkbox";
  required: boolean;
  choices: TemplateOptionChoice[];
}

// ── Product Template ──
export type ProductCategory = "blind" | "curtain" | "shutter" | "awning";
export type PricingModel = "area" | "grid" | "sqm" | "linear_metre" | "fixed";

export interface ProductTemplate {
  id: string;
  merchant_id: string;
  code: string;
  name: string;
  sku: string | null;
  category: ProductCategory;
  algorithm_code: string | null;
  pricing_model: PricingModel;
  min_width: number;
  max_width: number;
  min_drop: number;
  max_drop: number;
  min_depth: number | null;
  max_depth: number | null;
  min_diameter: number | null;
  max_diameter: number | null;
  default_deductions: Record<string, unknown> | null;
  options: TemplateOption[] | null;
  dimension_fields: Record<string, unknown> | null;
  labels: Record<string, unknown> | null;
  default_grid_id: string | null;
  vendor_id: string | null;
  pricing_formula: string | null;
  pricing_defaults: Record<string, unknown> | null;
  wastage_percent: number | null;
  pack_size: number | null;
  pack_unit: string | null;
  labour_cost: number | null;
  installation_cost: number | null;
  created_at: string;
  // Joined fields
  vendor?: Vendor;
}

// ── Pricing Grid ──
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
  // Joined fields
  product_template?: ProductTemplate;
  fabric?: Fabric;
}

// ── Fabric ──
export interface Fabric {
  id: string;
  merchant_id: string;
  name: string;
  category: string | null;
  colours: string[];
  roll_width: number | null;
  price_per_sqm: number | null;
  price_per_linear_metre: number | null;
  surcharge: number;
  created_at: string;
}

// ── Vendor ──
export interface Vendor {
  id: string;
  merchant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

// ── Quote ──
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export interface QuoteItem {
  template_code: string;
  template_name: string;
  width: number;
  drop: number;
  fabric?: string;
  colour?: string;
  options?: Record<string, unknown>;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Quote {
  id: string;
  merchant_id: string;
  quote_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  region: string | null;
  line_items: QuoteItem[];
  total_ex_tax: number;
  total_tax: number;
  total_inc_tax: number;
  status: QuoteStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// ── Work Order ──
export type WorkOrderStatus = "pending" | "in_production" | "completed" | "shipped";

export interface WorkOrderItem {
  template_code: string;
  template_name: string;
  width: number;
  drop: number;
  fabric?: string;
  colour?: string;
  options?: Record<string, unknown>;
  quantity: number;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  merchant_id: string;
  quote_id: string | null;
  status: WorkOrderStatus;
  items: WorkOrderItem[];
  notes: string | null;
  created_at: string;
  // Joined fields
  quote?: Quote;
}

// ── Shopify Product ──
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  status: string;
  image: { src: string; alt: string } | null;
  template_id: string | null;
}

// ── Analytics ──
export interface AnalyticsData {
  total_templates: number;
  total_quotes: number;
  total_orders: number;
  revenue: number;
  quotes_by_status: Record<QuoteStatus, number>;
  orders_by_status: Record<WorkOrderStatus, number>;
  recent_quotes: Quote[];
}

// ── API Response ──
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  count: number;
  error?: string;
}
