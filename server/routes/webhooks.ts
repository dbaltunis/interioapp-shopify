import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";

/**
 * Verify Shopify webhook HMAC signature.
 */
function verifyWebhookHmac(rawBody: Buffer, hmacHeader: string): boolean {
  if (!SHOPIFY_API_SECRET || !hmacHeader) return false;
  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(rawBody)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHmac),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

export function captureRawBody(req: Request, _res: Response, buf: Buffer) {
  (req as Request & { rawBody?: Buffer }).rawBody = buf;
}

/** POST /api/webhooks — app/uninstalled */
router.post("/", async (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    return res.status(401).send("Unauthorized");
  }
  const topic = req.headers["x-shopify-topic"] as string;
  const shopDomain = req.headers["x-shopify-shop-domain"] as string;
  if (topic === "app/uninstalled") {
    await supabase.from("merchants").update({
      status: "inactive", access_token: null, updated_at: new Date().toISOString(),
    }).eq("shop_domain", shopDomain);
  }
  res.status(200).send("OK");
});

/** POST /api/webhooks/orders-paid */
router.post("/orders-paid", async (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    return res.status(401).send("Unauthorized");
  }
  const shopDomain = req.headers["x-shopify-shop-domain"] as string;
  try {
    const order = req.body;
    const noteAttributes = order.note_attributes || [];
    const quoteIdAttr = noteAttributes.find((attr: { name: string; value: string }) => attr.name === "MeasureRight Quote ID");
    if (quoteIdAttr?.value) {
      const quoteId = quoteIdAttr.value;
      await supabase.from("quotes").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", quoteId);
      const { data: existingOrder } = await supabase.from("work_orders").select("id").eq("quote_id", quoteId).single();
      if (existingOrder) {
        await supabase.from("work_orders").update({
          status: "pending", shopify_order_id: order.id?.toString(),
          shopify_order_number: order.order_number?.toString(), updated_at: new Date().toISOString(),
        }).eq("id", existingOrder.id);
      }
    }
  } catch (err) {
    console.error("Error processing orders/paid webhook:", err);
  }
  res.status(200).send("OK");
});

/** POST /api/webhooks/customers/data_request — GDPR mandatory */
router.post("/customers/data_request", (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    return res.status(401).send("Unauthorized");
  }
  const { shop_domain, customer } = req.body;
  console.log(`[GDPR] Customer data request from ${shop_domain} for customer ${customer?.id}`);
  // MeasureRight stores only measurement/order data. No PII beyond what Shopify holds.
  res.status(200).send("OK");
});

/** POST /api/webhooks/customers/redact — GDPR mandatory */
router.post("/customers/redact", async (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    return res.status(401).send("Unauthorized");
  }
  const { shop_domain, customer } = req.body;
  console.log(`[GDPR] Customer redact from ${shop_domain} for customer ${customer?.id}`);
  // Delete quotes and work orders linked to this customer's orders
  try {
    const shopDomain = shop_domain as string;
    const { data: merchant } = await supabase.from("merchants").select("id").eq("shop_domain", shopDomain).single();
    if (merchant) {
      const orderIds: string[] = req.body.orders_to_redact?.map((o: { id: number }) => String(o.id)) || [];
      if (orderIds.length > 0) {
        await supabase.from("work_orders").delete().eq("merchant_id", merchant.id).in("shopify_order_id", orderIds);
      }
    }
  } catch (err) {
    console.error("[GDPR] Customer redact error:", err);
  }
  res.status(200).send("OK");
});

/** POST /api/webhooks/shop/redact — GDPR mandatory */
router.post("/shop/redact", async (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    return res.status(401).send("Unauthorized");
  }
  const { shop_domain } = req.body;
  console.log(`[GDPR] Shop redact for ${shop_domain}`);
  // Shop has uninstalled for 48+ days — delete all merchant data
  try {
    const { data: merchant } = await supabase.from("merchants").select("id").eq("shop_domain", shop_domain).single();
    if (merchant) {
      await supabase.from("quotes").delete().eq("merchant_id", merchant.id);
      await supabase.from("work_orders").delete().eq("merchant_id", merchant.id);
      await supabase.from("product_templates").delete().eq("merchant_id", merchant.id);
      await supabase.from("pricing_grids").delete().eq("merchant_id", merchant.id);
      await supabase.from("fabrics").delete().eq("merchant_id", merchant.id);
      await supabase.from("merchants").delete().eq("id", merchant.id);
      console.log(`[GDPR] Shop data deleted for ${shop_domain}`);
    }
  } catch (err) {
    console.error("[GDPR] Shop redact error:", err);
  }
  res.status(200).send("OK");
});

export default router;
