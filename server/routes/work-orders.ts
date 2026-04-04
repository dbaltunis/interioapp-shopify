import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  const { merchantId } = res.locals;
  const status = req.query.status as string;

  let query = supabase
    .from("work_orders")
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
    .from("work_orders")
    .select("*, quotes(customer_name, customer_email)")
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId)
    .single();

  if (error) return res.status(404).json({ error: "Work order not found" });
  res.json({ data });
});

router.post("/", async (req, res) => {
  const { merchantId } = res.locals;
  const { quote_id, items, notes } = req.body;

  let orderItems = items;

  // If creating from a quote, copy items from the quote
  if (quote_id && !items) {
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("items")
      .eq("id", quote_id)
      .eq("merchant_id", merchantId)
      .single();

    if (quoteError) return res.status(400).json({ error: "Quote not found" });
    orderItems = quote.items;
  }

  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      merchant_id: merchantId,
      quote_id: quote_id || null,
      items: orderItems || [],
      notes: notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.put("/:id", async (req, res) => {
  const { merchantId } = res.locals;
  const { id, merchant_id, created_at, quotes, ...updateData } = req.body;

  const { data, error } = await supabase
    .from("work_orders")
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
    .from("work_orders")
    .delete()
    .eq("id", req.params.id)
    .eq("merchant_id", merchantId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;
