import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { merchantId } = res.locals;

  const [templates, quotes, orders] = await Promise.all([
    supabase
      .from("product_templates")
      .select("id", { count: "exact" })
      .eq("merchant_id", merchantId),
    supabase
      .from("quotes")
      .select("id, status, total, created_at")
      .eq("merchant_id", merchantId),
    supabase
      .from("work_orders")
      .select("id, status")
      .eq("merchant_id", merchantId),
  ]);

  const allQuotes = quotes.data || [];
  const allOrders = orders.data || [];

  const quotesByStatus = allQuotes.reduce(
    (acc: Record<string, number>, q: { status: string }) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const ordersByStatus = allOrders.reduce(
    (acc: Record<string, number>, o: { status: string }) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const revenue = allQuotes
    .filter((q: { status: string }) => q.status === "accepted")
    .reduce((sum: number, q: { total: number }) => sum + (q.total || 0), 0);

  res.json({
    data: {
      total_templates: templates.count || 0,
      total_quotes: allQuotes.length,
      total_orders: allOrders.length,
      revenue,
      quotes_by_status: quotesByStatus,
      orders_by_status: ordersByStatus,
    },
  });
});

export default router;
