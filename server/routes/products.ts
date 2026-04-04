import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * GET /api/products
 * Returns Shopify products with their MeasureRight template link (if any).
 * In production, this would proxy to Shopify GraphQL API.
 * For now, returns a placeholder until Shopify API is fully integrated.
 */
router.get("/", async (_req, res) => {
  const { merchantId, shop } = res.locals;

  // Get the merchant's access token for Shopify API calls
  const { data: merchant } = await supabase
    .from("merchants")
    .select("access_token")
    .eq("id", merchantId)
    .single();

  if (!merchant?.access_token) {
    // Return empty list if no access token (dev mode)
    return res.json({ data: [] });
  }

  try {
    // Fetch products from Shopify REST API
    const shopifyRes = await fetch(
      `https://${shop}/admin/api/2024-01/products.json?limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": merchant.access_token,
          "Content-Type": "application/json",
        },
      }
    );

    if (!shopifyRes.ok) {
      return res.json({ data: [] });
    }

    const { products } = await shopifyRes.json();

    // Map to our format
    const mapped = products.map((p: Record<string, unknown>) => ({
      id: String(p.id),
      title: p.title,
      handle: p.handle,
      vendor: p.vendor,
      product_type: p.product_type,
      status: p.status,
      image: (p.image as Record<string, unknown>) || null,
      template_id: null, // Will be populated from metafields
    }));

    res.json({ data: mapped });
  } catch {
    res.json({ data: [] });
  }
});

/**
 * POST /api/products/:id/metafields
 * Set or remove the measureright.template_id metafield on a Shopify product.
 */
router.post("/:id/metafields", async (req, res) => {
  const { merchantId, shop } = res.locals;
  const productId = req.params.id;
  const { template_id } = req.body;

  const { data: merchant } = await supabase
    .from("merchants")
    .select("access_token")
    .eq("id", merchantId)
    .single();

  if (!merchant?.access_token) {
    return res.status(400).json({ error: "No access token" });
  }

  try {
    const metafield = {
      metafield: {
        namespace: "measureright",
        key: "template_id",
        value: template_id || "",
        type: "single_line_text_field",
      },
    };

    const shopifyRes = await fetch(
      `https://${shop}/admin/api/2024-01/products/${productId}/metafields.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": merchant.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metafield),
      }
    );

    if (!shopifyRes.ok) {
      const err = await shopifyRes.json();
      return res.status(400).json({ error: err.errors || "Shopify API error" });
    }

    const data = await shopifyRes.json();
    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to update metafield" });
  }
});

export default router;
