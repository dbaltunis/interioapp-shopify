import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * Public proxy API for the storefront calculator widget.
 * Shopify App Proxy forwards requests from /apps/measureright/* to /proxy/*
 * and appends ?shop=SHOP_DOMAIN&timestamp=...&signature=...
 */

// GET /proxy/api/calculator?template_code=roller-blind&shop=store.myshopify.com
router.get("/api/calculator", async (req, res) => {
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
      .select("id, width_bands, drop_bands, prices, fabric_id")
      .eq("product_template_id", template.id)
      .eq("merchant_id", merchant.id);

    // Get fabrics for this merchant
    const { data: fabrics } = await supabase
      .from("fabrics")
      .select("id, name, category, colours, surcharge")
      .eq("merchant_id", merchant.id)
      .order("name");

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
        options: template.options,
        labels: template.labels,
        labour_cost: template.labour_cost,
        installation_cost: template.installation_cost,
        wastage_percent: template.wastage_percent,
      },
      grids: grids || [],
      fabrics: fabrics || [],
    });
  } catch (err) {
    console.error("Proxy calculator error:", err);
    res.status(500).json({ error: "Failed to load calculator data" });
  }
});

// Health check for proxy
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "proxy" });
});

export default router;
