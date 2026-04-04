import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { merchantId } = res.locals;
  const { data, error } = await supabase
    .from("merchants")
    .select("id, shop_domain, status, installed_at, updated_at")
    .eq("id", merchantId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

export default router;
