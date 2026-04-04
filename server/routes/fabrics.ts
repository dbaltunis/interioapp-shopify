import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  const { merchantId } = res.locals;
  const category = req.query.category as string;

  let query = supabase
    .from("fabrics")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("name");

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.get("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("fabrics")
    .select("*")
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .single();

  if (error) return res.status(404).json({ error: "Fabric not found" });
  res.json({ data });
});

router.post("/", async (req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("fabrics")
    .insert({ ...req.body, merchant_id: merchantId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.put("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { id, merchant_id, created_at, ...updateData } = req.body;

  const { data, error } = await supabase
    .from("fabrics")
    .update(updateData)
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

router.delete("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { error } = await supabase
    .from("fabrics")
    .delete()
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;
