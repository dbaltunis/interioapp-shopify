import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

/**
 * Middleware that extracts merchant info from the request.
 * In production, this validates the Shopify session token.
 * In development, it uses a query param or header for the shop domain.
 */
export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Try to get shop from various sources
    const shop =
      (req.query.shop as string) ||
      req.headers["x-shopify-shop-domain"] as string ||
      "";

    if (!shop) {
      // In development without Shopify, allow unauthenticated access
      if (process.env.NODE_ENV !== "production") {
        // Try to find any merchant for dev purposes
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
