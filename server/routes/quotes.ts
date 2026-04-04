import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  const { merchantId } = res.locals;
  const status = req.query.status as string;

  let query = supabase
    .from("quotes")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.get("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .single();

  if (error) return res.status(404).json({ error: "Quote not found" });
  res.json({ data });
});

router.post("/", async (req, res) => {
  const { merchantId } = res.locals;
  const { items, ...rest } = req.body;

  // Calculate total from items
  const total = items?.reduce(
    (sum: number, item: { line_total?: number }) => sum + (item.line_total || 0),
    0
  ) || 0;

  const { data, error } = await supabase
    .from("quotes")
    .insert({ ...rest, items, total, merchant_id: merchantId, status: rest.status || "draft" })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.put("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { id, merchant_id, created_at, ...updateData } = req.body;

  // Recalculate total if items changed
  if (updateData.items) {
    updateData.total = updateData.items.reduce(
      (sum: number, item: { line_total?: number }) => sum + (item.line_total || 0),
      0
    );
  }

  const { data, error } = await supabase
    .from("quotes")
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
    .from("quotes")
    .delete()
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;
