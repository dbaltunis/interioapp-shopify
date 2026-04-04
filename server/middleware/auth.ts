import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";

/**
 * Decode and verify a Shopify session token (JWT) from App Bridge.
 * Returns the payload if valid, or null if invalid/expired.
 */
function verifySessionToken(token: string): { dest: string; iss: string; sub: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Verify HMAC signature
    const [headerB64, payloadB64, signatureB64] = parts;
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac("sha256", SHOPIFY_API_SECRET)
      .update(signatureInput)
      .digest("base64url");

    if (expectedSignature !== signatureB64) return null;

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    // Check expiration (with 10s leeway)
    if (payload.exp && payload.exp < Date.now() / 1000 - 10) return null;

    // Validate issuer format
    if (!payload.iss || !payload.dest) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract shop domain from a Shopify session token's `dest` field.
 * dest is like "https://shop-name.myshopify.com"
 */
function extractShopFromDest(dest: string): string {
  try {
    const url = new URL(dest);
    return url.hostname;
  } catch {
    return "";
  }
}

/**
 * Middleware that extracts merchant info from the request.
 *
 * Authentication order:
 * 1. Shopify session token (Authorization: Bearer <token>) — used by embedded app via App Bridge
 * 2. Shop query param or header — used for OAuth redirects and dev mode
 * 3. Dev fallback — picks first merchant from DB
 */
export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let shop = "";

    // 1. Try session token from App Bridge (embedded app)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ") && SHOPIFY_API_SECRET) {
      const token = authHeader.slice(7);
      const payload = verifySessionToken(token);
      if (payload) {
        shop = extractShopFromDest(payload.dest);
      }
    }

    // 2. Fall back to query param or header
    if (!shop) {
      shop =
        (req.query.shop as string) ||
        (req.headers["x-shopify-shop-domain"] as string) ||
        "";
    }

    // 3. Dev fallback — find any merchant
    if (!shop && process.env.NODE_ENV !== "production") {
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id, shop_domain")
        .limit(1)
        .single();

      if (merchant) {
        res.locals.merchantId = merchant.id;
        res.locals.shop = merchant.shop_domain;
        return next();
      }
    }

    if (!shop) {
      return res.status(401).json({ error: "Shop domain required" });
    }

    // Look up the merchant
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("id, shop_domain, status")
      .eq("shop_domain", shop)
      .single();

    if (error || !merchant) {
      return res.status(401).json({ error: "Merchant not found" });
    }

    if (merchant.status !== "active") {
      return res.status(403).json({ error: "Merchant account is inactive" });
    }

    res.locals.merchantId = merchant.id;
    res.locals.shop = merchant.shop_domain;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}
