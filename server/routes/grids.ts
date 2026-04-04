import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// List grids
router.get("/", async (req, res) => {
  const { merchantId } = res.locals;
  const templateId = req.query.template_id as string;
  const fabricId = req.query.fabric_id as string;

  let query = supabase
    .from("pricing_grids")
    .select("*, product_templates(name), fabrics(name)")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (templateId) query = query.eq("product_template_id", templateId);
  if (fabricId) query = query.eq("fabric_id", fabricId);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Get single grid
router.get("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("pricing_grids")
    .select("*, product_templates(name), fabrics(name)")
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .single();

  if (error) return res.status(404).json({ error: "Grid not found" });
  res.json({ data });
});

// Create grid
router.post("/", async (req, res) => {
  const { merchantId } = res.locals;
  const { width_bands, drop_bands, prices, ...rest } = req.body;

  // Validate prices array length
  if (prices && width_bands && drop_bands) {
    const expected = width_bands.length * drop_bands.length;
    if (prices.length !== expected) {
      return res.status(400).json({
        error: `Prices array length (${prices.length}) must equal width_bands (${width_bands.length}) × drop_bands (${drop_bands.length}) = ${expected}`,
      });
    }
  }

  const { data, error } = await supabase
    .from("pricing_grids")
    .insert({ ...rest, width_bands, drop_bands, prices, merchant_id: merchantId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// Update grid
router.put("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { id, merchant_id, created_at, product_templates, fabrics, ...updateData } = req.body;

  const { data, error } = await supabase
    .from("pricing_grids")
    .update(updateData)
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// Delete grid
router.delete("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { error } = await supabase
    .from("pricing_grids")
    .delete()
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;
