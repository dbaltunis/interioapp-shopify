import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

const API_VERSION = "2025-01";

/**
 * Helper: get merchant access token
 */
async function getAccessToken(merchantId: string): Promise<string | null> {
  const { data } = await supabase
    .from("merchants")
    .select("access_token")
    .eq("id", merchantId)
    .single();
  return data?.access_token || null;
}

/**
 * Helper: fetch metafields for a product
 */
async function getProductMetafields(
  shop: string,
  accessToken: string,
  productId: string
): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/products/${productId}/metafields.json?namespace=measureright`,
      { headers: { "X-Shopify-Access-Token": accessToken } }
    );
    if (!res.ok) return {};
    const { metafields } = await res.json();
    const result: Record<string, string> = {};
    for (const mf of metafields || []) {
      result[mf.key] = mf.value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * GET /api/products
 * Returns Shopify products with their MeasureRight template link.
 */
router.get("/", async (_req, res) => {
  const { merchantId, shop } = res.locals;

  const accessToken = await getAccessToken(merchantId);
  if (!accessToken) return res.json({ data: [] });

  try {
    const shopifyRes = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/products.json?limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!shopifyRes.ok) return res.json({ data: [] });

    const { products } = await shopifyRes.json();

    // Fetch metafields for each product in parallel
    const mapped = await Promise.all(
      products.map(async (p: Record<string, unknown>) => {
        const metafields = await getProductMetafields(shop, accessToken, String(p.id));
        return {
          id: String(p.id),
          title: p.title,
          handle: p.handle,
          vendor: p.vendor,
          product_type: p.product_type,
          status: p.status,
          image: (p.image as Record<string, unknown>) || null,
          template_id: metafields.template_id || null,
        };
      })
    );

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

  const accessToken = await getAccessToken(merchantId);
  if (!accessToken) return res.status(400).json({ error: "No access token" });

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
      `https://${shop}/admin/api/${API_VERSION}/products/${productId}/metafields.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
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

/**
 * POST /api/products/auto-assign
 * Auto-assign templates to products based on product type matching.
 * Maps product types to template categories/codes.
 */
router.post("/auto-assign", async (req, res) => {
  const { merchantId, shop } = res.locals;
  const { mappings } = req.body as {
    mappings: Array<{ product_type: string; template_code: string }>;
  };

  if (!mappings?.length) {
    return res.status(400).json({ error: "No mappings provided" });
  }

  const accessToken = await getAccessToken(merchantId);
  if (!accessToken) return res.status(400).json({ error: "No access token" });

  try {
    // Get all templates for this merchant
    const { data: templates } = await supabase
      .from("product_templates")
      .select("id, code, name")
      .eq("merchant_id", merchantId);

    if (!templates?.length) {
      return res.status(400).json({ error: "No templates found. Create templates first." });
    }

    const templateByCode = new Map(templates.map((t) => [t.code, t]));

    // Fetch all products
    const shopifyRes = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/products.json?limit=250`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!shopifyRes.ok) {
      return res.status(502).json({ error: "Failed to fetch products from Shopify" });
    }

    const { products } = await shopifyRes.json();
    let assigned = 0;
    let skipped = 0;

    for (const mapping of mappings) {
      const template = templateByCode.get(mapping.template_code);
      if (!template) continue;

      // Find products matching this product type (case-insensitive)
      const matchingProducts = products.filter(
        (p: Record<string, unknown>) =>
          String(p.product_type || "").toLowerCase() === mapping.product_type.toLowerCase()
      );

      for (const product of matchingProducts) {
        try {
          const metafieldRes = await fetch(
            `https://${shop}/admin/api/${API_VERSION}/products/${product.id}/metafields.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metafield: {
                  namespace: "measureright",
                  key: "template_id",
                  value: template.code,
                  type: "single_line_text_field",
                },
              }),
            }
          );
          if (metafieldRes.ok) assigned++;
          else skipped++;
        } catch {
          skipped++;
        }
      }
    }

    res.json({
      data: {
        assigned,
        skipped,
        message: `Assigned ${assigned} product(s) to templates.${skipped > 0 ? ` ${skipped} skipped.` : ""}`,
      },
    });
  } catch (err) {
    console.error("Auto-assign error:", err);
    res.status(500).json({ error: "Failed to auto-assign products" });
  }
});

export default router;
