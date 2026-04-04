import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * Public proxy API for the storefront calculator widget.
 * Shopify App Proxy forwards requests from /apps/measureright/* to /proxy/*
 * and appends ?shop=SHOP_DOMAIN&timestamp=...&signature=...
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface OptionDef {
  key: string;
  label: string;
  type: string;
  values?: { label: string; value: string; price_type: string; price_value: number }[];
}

interface PricingGrid {
  id: string;
  width_bands: number[];
  drop_bands: number[];
  prices: number[];
  fabric_id: string | null;
  price_per_sqm?: number;
  price_per_linear_metre?: number;
}

interface Template {
  id: string;
  code: string;
  name: string;
  category: string;
  pricing_model: string;
  min_width: number;
  max_width: number;
  min_drop: number;
  max_drop: number;
  options: OptionDef[] | null;
  labels: Record<string, string> | null;
  labour_cost: number;
  installation_cost: number;
  wastage_percent: number;
  merchant_id: string;
}

/**
 * Find the band index for a given dimension value.
 * Bands are upper-bound thresholds – pick the first band >= value.
 */
function findBandIndex(bands: number[], value: number): number {
  for (let i = 0; i < bands.length; i++) {
    if (value <= bands[i]) return i;
  }
  return bands.length - 1; // clamp to last band
}

/**
 * Compute the base price from the pricing model.
 */
function computeBasePrice(
  model: string,
  grid: PricingGrid | null,
  width: number,
  drop: number
): number {
  if (!grid) return 0;

  // Check if grid has a full band/price matrix
  const hasGridMatrix =
    grid.width_bands?.length > 0 &&
    grid.drop_bands?.length > 0 &&
    grid.prices?.length > 0;

  // If model is area/sqm but grid has a matrix, use grid lookup
  if (model === "grid" || ((model === "area" || model === "sqm") && hasGridMatrix)) {
    const wIdx = findBandIndex(grid.width_bands, width);
    const dIdx = findBandIndex(grid.drop_bands, drop);
    return grid.prices[dIdx * grid.width_bands.length + wIdx] ?? 0;
  }

  switch (model) {
    case "sqm":
    case "area": {
      const ppsqm = grid.price_per_sqm ?? 0;
      return (width / 1000) * (drop / 1000) * ppsqm;
    }
    case "linear_metre": {
      const pplm = grid.price_per_linear_metre ?? 0;
      return (width / 1000) * pplm;
    }
    case "fixed": {
      return grid.prices?.[0] ?? 0;
    }
    default:
      return 0;
  }
}

/**
 * Compute the minimum possible price from a grid (smallest value in the prices array,
 * or sqm/linear at min dimensions).
 */
function computeMinimumPrice(
  model: string,
  grid: PricingGrid | null,
  template: Template
): number {
  if (!grid) return 0;

  const hasGridMatrix =
    grid.width_bands?.length > 0 &&
    grid.drop_bands?.length > 0 &&
    grid.prices?.length > 0;

  // If the grid has a matrix, find minimum from it regardless of model name
  if (model === "grid" || ((model === "area" || model === "sqm") && hasGridMatrix)) {
    return Math.min(...grid.prices.filter((p) => p > 0));
  }

  switch (model) {
    case "sqm":
    case "area": {
      const ppsqm = grid.price_per_sqm ?? 0;
      return (template.min_width / 1000) * (template.min_drop / 1000) * ppsqm;
    }
    case "linear_metre": {
      const pplm = grid.price_per_linear_metre ?? 0;
      return (template.min_width / 1000) * pplm;
    }
    case "fixed":
      return grid.prices?.[0] ?? 0;
    default:
      return 0;
  }
}

/**
 * Full price calculation including options, fabric surcharge, wastage, labour
 * and installation.
 */
function calculateFullPrice(
  template: Template,
  grid: PricingGrid | null,
  fabricSurcharge: number,
  width: number,
  drop: number,
  selectedOptions: Record<string, string>
): {
  total: number;
  breakdown: {
    base: number;
    fabric_surcharge: number;
    options_total: number;
    wastage: number;
    labour: number;
    installation: number;
  };
} {
  let base = computeBasePrice(template.pricing_model, grid, width, drop);
  const templateOptions: OptionDef[] = template.options ?? [];

  // --- Apply option surcharges ---
  // Pass 1: multipliers replace the base
  for (const opt of templateOptions) {
    const selectedValue = selectedOptions[opt.key];
    if (!selectedValue || !opt.values) continue;
    const match = opt.values.find((v) => v.value === selectedValue);
    if (!match) continue;
    if (match.price_type === "multiplier") {
      base = base * match.price_value;
    }
  }

  // Pass 2: accumulate flat / per_sqm / per_linear_metre
  let optionsTotal = 0;
  for (const opt of templateOptions) {
    const selectedValue = selectedOptions[opt.key];
    if (!selectedValue || !opt.values) continue;
    const match = opt.values.find((v) => v.value === selectedValue);
    if (!match) continue;
    switch (match.price_type) {
      case "flat":
        optionsTotal += match.price_value;
        break;
      case "per_sqm":
        optionsTotal += match.price_value * (width / 1000) * (drop / 1000);
        break;
      case "per_linear_metre":
        optionsTotal += match.price_value * (width / 1000);
        break;
      // "none" and "multiplier" already handled
    }
  }

  // Fabric surcharge
  const fabricSurchargeAmount = fabricSurcharge ?? 0;

  // Wastage applies on (base + fabric surcharge)
  const wastageRate = (template.wastage_percent ?? 0) / 100;
  const wastage = (base + fabricSurchargeAmount) * wastageRate;

  const labour = template.labour_cost ?? 0;
  const installation = template.installation_cost ?? 0;

  const total =
    Math.round(
      (base + optionsTotal + fabricSurchargeAmount + wastage + labour + installation) * 100
    ) / 100;

  return {
    total,
    breakdown: {
      base: Math.round(base * 100) / 100,
      fabric_surcharge: Math.round(fabricSurchargeAmount * 100) / 100,
      options_total: Math.round(optionsTotal * 100) / 100,
      wastage: Math.round(wastage * 100) / 100,
      labour: Math.round(labour * 100) / 100,
      installation: Math.round(installation * 100) / 100,
    },
  };
}

/**
 * Shared lookup: resolve merchant, template, grid, and fabric for a given
 * shop + template_code + optional fabric_id.
 */
async function resolveTemplateData(
  shop: string,
  templateCode: string,
  fabricId?: string
): Promise<{
  merchant: { id: string; access_token?: string };
  template: Template;
  grid: PricingGrid | null;
  fabric: { id: string; name: string; surcharge: number } | null;
} | { error: string; status: number }> {
  // Merchant
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, access_token")
    .eq("shop_domain", shop)
    .single();

  if (!merchant) return { error: "Shop not found", status: 404 };

  // Template
  const { data: template } = await supabase
    .from("product_templates")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("code", templateCode)
    .single();

  if (!template) return { error: "Template not found", status: 404 };

  // Grid (prefer fabric-specific grid, fallback to generic)
  let grid: PricingGrid | null = null;
  if (fabricId) {
    const { data: fabricGrid } = await supabase
      .from("pricing_grids")
      .select("id, width_bands, drop_bands, prices, fabric_id, price_per_sqm, price_per_linear_metre")
      .eq("product_template_id", template.id)
      .eq("merchant_id", merchant.id)
      .eq("fabric_id", fabricId)
      .single();
    grid = fabricGrid;
  }
  if (!grid) {
    const { data: defaultGrid } = await supabase
      .from("pricing_grids")
      .select("id, width_bands, drop_bands, prices, fabric_id, price_per_sqm, price_per_linear_metre")
      .eq("product_template_id", template.id)
      .eq("merchant_id", merchant.id)
      .is("fabric_id", null)
      .single();
    grid = defaultGrid;
  }

  // Fabric
  let fabric: { id: string; name: string; surcharge: number } | null = null;
  if (fabricId) {
    const { data: f } = await supabase
      .from("fabrics")
      .select("id, name, surcharge")
      .eq("id", fabricId)
      .eq("merchant_id", merchant.id)
      .single();
    fabric = f;
  }

  return { merchant, template: template as Template, grid, fabric };
}

// ---------------------------------------------------------------------------
// GET /proxy/api/calculator
// ---------------------------------------------------------------------------

router.get("/api/calculator", async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as string;
    const templateCode = req.query.template_code as string;
    const templateId = req.query.template_id as string;

    if (!shop) {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    // Look up merchant by shop domain
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("shop_domain", shop)
      .single();

    if (!merchant) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Look up template by code or id
    let templateQuery = supabase
      .from("product_templates")
      .select("*")
      .eq("merchant_id", merchant.id);

    if (templateCode) {
      templateQuery = templateQuery.eq("code", templateCode);
    } else if (templateId) {
      templateQuery = templateQuery.eq("id", templateId);
    } else {
      return res.status(400).json({ error: "Missing template_code or template_id parameter" });
    }

    const { data: template } = await templateQuery.single();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Get pricing grids for this template
    const { data: grids } = await supabase
      .from("pricing_grids")
      .select("id, width_bands, drop_bands, prices, fabric_id, price_per_sqm, price_per_linear_metre")
      .eq("product_template_id", template.id)
      .eq("merchant_id", merchant.id);

    // Get fabrics for this merchant
    const { data: fabrics } = await supabase
      .from("fabrics")
      .select("id, name, category, colours, surcharge")
      .eq("merchant_id", merchant.id)
      .order("name");

    // Compute minimum price from the first (or default) grid
    const defaultGrid =
      (grids ?? []).find((g: PricingGrid) => !g.fabric_id) ?? (grids ?? [])[0] ?? null;

    const minimum_price = defaultGrid
      ? computeMinimumPrice(template.pricing_model, defaultGrid, template as Template)
      : 0;

    // Extract price_per_sqm and price_per_linear_metre from the default grid
    const price_per_sqm = defaultGrid?.price_per_sqm ?? null;
    const price_per_linear_metre = defaultGrid?.price_per_linear_metre ?? null;

    res.json({
      template: {
        id: template.id,
        code: template.code,
        name: template.name,
        category: template.category,
        pricing_model: template.pricing_model,
        min_width: template.min_width,
        max_width: template.max_width,
        min_drop: template.min_drop,
        max_drop: template.max_drop,
        options: template.options ?? [],
        labels: template.labels,
        labour_cost: template.labour_cost,
        installation_cost: template.installation_cost,
        wastage_percent: template.wastage_percent,
      },
      minimum_price: Math.round(minimum_price * 100) / 100,
      price_per_sqm,
      price_per_linear_metre,
      grids: grids || [],
      fabrics: fabrics || [],
    });
  } catch (err) {
    console.error("Proxy calculator error:", err);
    res.status(500).json({ error: "Failed to load calculator data" });
  }
});

// ---------------------------------------------------------------------------
// POST /proxy/api/validate-price
// ---------------------------------------------------------------------------

router.post("/api/validate-price", async (req: Request, res: Response) => {
  try {
    const { template_code, width, drop, fabric_id, options, shop } = req.body;

    if (!shop || !template_code || width == null || drop == null) {
      return res.status(400).json({
        error: "Missing required fields: shop, template_code, width, drop",
      });
    }

    const result = await resolveTemplateData(shop, template_code, fabric_id);
    if ("error" in result) {
      return res.status(result.status).json({ error: result.error });
    }

    const { template, grid, fabric } = result;

    // Validate dimensions
    if (width < template.min_width || width > template.max_width) {
      return res.status(400).json({
        error: `Width ${width}mm is outside allowed range (${template.min_width}–${template.max_width}mm)`,
      });
    }
    if (drop < template.min_drop || drop > template.max_drop) {
      return res.status(400).json({
        error: `Drop ${drop}mm is outside allowed range (${template.min_drop}–${template.max_drop}mm)`,
      });
    }

    const fabricSurcharge = fabric?.surcharge ?? 0;
    const selectedOptions: Record<string, string> = options ?? {};

    const { total, breakdown } = calculateFullPrice(
      template,
      grid,
      fabricSurcharge,
      width,
      drop,
      selectedOptions
    );

    res.json({ valid: true, total, breakdown });
  } catch (err) {
    console.error("Proxy validate-price error:", err);
    res.status(500).json({ error: "Failed to validate price" });
  }
});

// ---------------------------------------------------------------------------
// POST /proxy/api/create-checkout
// ---------------------------------------------------------------------------

router.post("/api/create-checkout", async (req: Request, res: Response) => {
  try {
    const {
      shop,
      template_code,
      width,
      drop,
      fabric_id,
      fabric_name,
      colour,
      options,
      quantity,
    } = req.body;

    if (!shop || !template_code || width == null || drop == null) {
      return res.status(400).json({
        error: "Missing required fields: shop, template_code, width, drop",
      });
    }

    const result = await resolveTemplateData(shop, template_code, fabric_id);
    if ("error" in result) {
      return res.status(result.status).json({ error: result.error });
    }

    const { merchant, template, grid, fabric } = result;

    if (!merchant.access_token) {
      return res.status(403).json({ error: "Merchant access token not available" });
    }

    // Validate dimensions
    if (width < template.min_width || width > template.max_width) {
      return res.status(400).json({
        error: `Width ${width}mm is outside allowed range (${template.min_width}–${template.max_width}mm)`,
      });
    }
    if (drop < template.min_drop || drop > template.max_drop) {
      return res.status(400).json({
        error: `Drop ${drop}mm is outside allowed range (${template.min_drop}–${template.max_drop}mm)`,
      });
    }

    // Calculate price server-side
    const fabricSurcharge = fabric?.surcharge ?? 0;
    const selectedOptions: Record<string, string> = options ?? {};

    const { total } = calculateFullPrice(
      template,
      grid,
      fabricSurcharge,
      width,
      drop,
      selectedOptions
    );

    // Build line item properties
    const properties: { name: string; value: string }[] = [
      { name: "Width", value: `${width}mm` },
      { name: "Drop", value: `${drop}mm` },
    ];

    if (fabric_name) {
      properties.push({ name: "Fabric", value: fabric_name });
    }
    if (colour) {
      properties.push({ name: "Colour", value: colour });
    }

    // Add selected options as properties
    const templateOptions: OptionDef[] = template.options ?? [];
    for (const [key, value] of Object.entries(selectedOptions)) {
      const optDef = templateOptions.find((o) => o.key === key);
      const label = optDef?.label ?? key;
      properties.push({ name: label, value: String(value) });
    }

    const qty = quantity ?? 1;
    const lineTitle = `${template.name} - ${width}mm x ${drop}mm`;

    // Create draft order via Shopify Admin REST API
    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            title: lineTitle,
            price: total.toFixed(2),
            quantity: qty,
            properties,
          },
        ],
      },
    };

    const shopifyResponse = await fetch(
      `https://${shop}/admin/api/2024-01/draft_orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": merchant.access_token,
        },
        body: JSON.stringify(draftOrderPayload),
      }
    );

    if (!shopifyResponse.ok) {
      const errBody = await shopifyResponse.text();
      console.error("Shopify draft order creation failed:", shopifyResponse.status, errBody);
      return res.status(502).json({ error: "Failed to create draft order" });
    }

    const { draft_order } = await shopifyResponse.json();

    // Send invoice to get checkout URL
    const invoiceResponse = await fetch(
      `https://${shop}/admin/api/2024-01/draft_orders/${draft_order.id}/send_invoice.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": merchant.access_token,
        },
        body: JSON.stringify({ draft_order_invoice: {} }),
      }
    );

    let checkoutUrl = draft_order.invoice_url || null;

    if (invoiceResponse.ok) {
      const invoiceData = await invoiceResponse.json();
      checkoutUrl = invoiceData?.draft_order_invoice?.invoice_url || checkoutUrl;
    }

    res.json({
      checkout_url: checkoutUrl,
      order_id: draft_order.id,
      total,
    });
  } catch (err) {
    console.error("Proxy create-checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout" });
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "proxy" });
});

export default router;
