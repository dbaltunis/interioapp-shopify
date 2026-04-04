import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";

/**
 * Verify Shopify webhook HMAC signature.
 * Shopify sends the HMAC in the X-Shopify-Hmac-Sha256 header.
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

/**
 * Middleware to capture raw body for HMAC verification.
 * Must be applied before express.json() parses the body.
 */
export function captureRawBody(req: Request, _res: Response, buf: Buffer) {
  (req as Request & { rawBody?: Buffer }).rawBody = buf;
}

/**
 * POST /api/webhooks
 * Handles app/uninstalled webhook — marks merchant as inactive.
 */
router.post("/", async (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    console.warn("Webhook HMAC verification failed");
    return res.status(401).send("Unauthorized");
  }

  const topic = req.headers["x-shopify-topic"] as string;
  const shopDomain = req.headers["x-shopify-shop-domain"] as string;

  console.log(`Webhook received: ${topic} from ${shopDomain}`);

  if (topic === "app/uninstalled") {
    // Mark merchant as inactive and clear access token
    const { error } = await supabase
      .from("merchants")
      .update({
        status: "inactive",
        access_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("shop_domain", shopDomain);

    if (error) {
      console.error(`Failed to deactivate merchant ${shopDomain}:`, error);
    } else {
      console.log(`Merchant ${shopDomain} marked as inactive (app uninstalled)`);
    }
  }

  // Always respond 200 to acknowledge receipt
  res.status(200).send("OK");
});

/**
 * POST /api/webhooks/orders-paid
 * Handles orders/paid webhook — updates work order status if linked to a quote.
 */
router.post("/orders-paid", async (req: Request, res: Response) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody || !verifyWebhookHmac(rawBody, hmacHeader)) {
    console.warn("Webhook HMAC verification failed (orders-paid)");
    return res.status(401).send("Unauthorized");
  }

  const shopDomain = req.headers["x-shopify-shop-domain"] as string;

  try {
    const order = req.body;
    const noteAttributes = order.note_attributes || [];

    // Check if this order came from a MeasureRight quote
    const quoteIdAttr = noteAttributes.find(
      (attr: { name: string; value: string }) => attr.name === "MeasureRight Quote ID"
    );

    if (quoteIdAttr?.value) {
      const quoteId = quoteIdAttr.value;

      // Update quote status to accepted
      await supabase
        .from("quotes")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", quoteId);

      // Create or update work order
      const { data: existingOrder } = await supabase
        .from("work_orders")
        .select("id")
        .eq("quote_id", quoteId)
        .single();

      if (existingOrder) {
        await supabase
          .from("work_orders")
          .update({
            status: "pending",
            shopify_order_id: order.id?.toString(),
            shopify_order_number: order.order_number?.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id);
      }

      console.log(`Order paid for quote ${quoteId} from ${shopDomain}`);
    }
  } catch (err) {
    console.error("Error processing orders/paid webhook:", err);
  }

  res.status(200).send("OK");
});

export default router;
