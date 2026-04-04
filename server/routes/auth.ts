import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const HOST = process.env.HOST || "https://measureright-production-4bef.up.railway.app";
const SCOPES = process.env.SCOPES || "read_products,write_products,read_orders,write_draft_orders,read_themes,write_themes";

/**
 * GET /api/auth
 * Initiates the OAuth flow by redirecting to Shopify's authorization page.
 */
router.get("/", (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).json({ error: "Invalid shop domain" });
  }

  const nonce = crypto.randomBytes(16).toString("hex");

  // Store nonce in a cookie for CSRF validation
  res.cookie("shopify_nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600_000, // 10 minutes
  });

  const redirectUri = `${HOST}/api/auth/callback`;
  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  res.redirect(authUrl);
});

/**
 * GET /api/auth/callback
 * Shopify redirects here after the merchant approves the app.
 * Exchanges the authorization code for a permanent access token.
 */
router.get("/callback", async (req: Request, res: Response) => {
  const { shop, code, state, hmac, timestamp } = req.query as Record<string, string>;

  // 1. Validate required params
  if (!shop || !code || !hmac) {
    return res.status(400).json({ error: "Missing required OAuth parameters" });
  }

  // 2. Validate shop domain format
  if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).json({ error: "Invalid shop domain" });
  }

  // 3. Verify HMAC signature
  const queryParams = { ...req.query } as Record<string, string>;
  delete queryParams.hmac;
  delete queryParams.signature;

  const sortedParams = Object.keys(queryParams)
    .sort()
    .map((key) => `${key}=${queryParams[key]}`)
    .join("&");

  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(generatedHmac, "hex"), Buffer.from(hmac, "hex"))) {
    return res.status(403).json({ error: "HMAC validation failed" });
  }

  // 4. Verify nonce matches (CSRF protection)
  const storedNonce = req.cookies?.shopify_nonce;
  if (storedNonce && state !== storedNonce) {
    return res.status(403).json({ error: "State/nonce mismatch — possible CSRF attack" });
  }

  try {
    // 5. Exchange authorization code for permanent access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", errText);
      return res.status(502).json({ error: "Failed to exchange authorization code" });
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      scope: string;
    };

    // 6. Upsert merchant in Supabase
    const { error: upsertError } = await supabase
      .from("merchants")
      .upsert(
        {
          shop_domain: shop,
          access_token: tokenData.access_token,
          scopes: tokenData.scope,
          status: "active",
          installed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "shop_domain" }
      );

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return res.status(500).json({ error: "Failed to store merchant data" });
    }

    console.log(`OAuth complete for ${shop} — scopes: ${tokenData.scope}`);

    // 7. Clear the nonce cookie
    res.clearCookie("shopify_nonce");

    // 8. Redirect to the embedded app inside Shopify admin
    res.redirect(`https://${shop}/admin/apps/${SHOPIFY_API_KEY}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).json({ error: "OAuth callback failed" });
  }
});

export default router;
