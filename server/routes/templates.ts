import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// List all templates for merchant
router.get("/", async (req, res) => {
  const { merchantId } = res.locals;
  const category = req.query.category as string;

  let query = supabase
    .from("product_templates")
    .select("*, vendors(name)")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Get single template
router.get("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("product_templates")
    .select("*, vendors(name)")
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .single();

  if (error) return res.status(404).json({ error: "Template not found" });
  res.json({ data });
});

// Create template
router.post("/", async (req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("product_templates")
    .insert({ ...req.body, merchant_id: merchantId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// Update template
router.put("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { id, merchant_id, created_at, vendor, ...updateData } = req.body;

  const { data, error } = await supabase
    .from("product_templates")
    .update(updateData)
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// Delete template
router.delete("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { error } = await supabase
    .from("product_templates")
    .delete()
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;
