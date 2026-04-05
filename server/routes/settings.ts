import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * GET /api/settings
 * Returns the merchant's settings (currency, units, markup configuration).
 */
router.get("/", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("currency, markup_mode, markup_value")
      .eq("id", merchantId)
      .single();

    if (error || !merchant) {
      return res.json({
        data: {
          currency: "USD",
          markup_mode: "percentage",
          markup_value: 0,
        },
      });
    }

    res.json({
      data: {
        currency: merchant.currency || "USD",
        markup_mode: merchant.markup_mode || "percentage",
        markup_value: merchant.markup_value ?? 0,
      },
    });
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * PUT /api/settings
 * Updates the merchant's settings.
 */
router.put("/", async (req, res) => {
  const { merchantId } = res.locals;
  const { currency, markup_mode, markup_value } = req.body;

  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (currency) updates.currency = currency;
    if (markup_mode) updates.markup_mode = markup_mode;
    if (markup_value !== undefined) updates.markup_value = Number(markup_value);

    const { error } = await supabase
      .from("merchants")
      .update(updates)
      .eq("id", merchantId);

    if (error) {
      console.error("Settings update error:", error);
      return res.status(500).json({ error: "Failed to update settings" });
    }

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/**
 * GET /api/settings/export
 * Exports all merchant data as JSON.
 */
router.get("/export", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    // Fetch all merchant data in parallel
    const [
      { data: templates },
      { data: fabrics },
      { data: vendors },
      { data: grids },
      { data: quotes },
      { data: workOrders },
    ] = await Promise.all([
      supabase.from("product_templates").select("*").eq("merchant_id", merchantId),
      supabase.from("fabrics").select("*").eq("merchant_id", merchantId),
      supabase.from("vendors").select("*").eq("merchant_id", merchantId),
      supabase.from("pricing_grids").select("*").eq("merchant_id", merchantId),
      supabase.from("quotes").select("*").eq("merchant_id", merchantId),
      supabase.from("work_orders").select("*").eq("merchant_id", merchantId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      templates: templates || [],
      fabrics: fabrics || [],
      vendors: vendors || [],
      pricing_grids: grids || [],
      quotes: quotes || [],
      work_orders: workOrders || [],
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="measureright-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});

export default router;
