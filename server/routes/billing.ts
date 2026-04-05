import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

const SHOPIFY_API_VERSION = "2025-01";

interface BillingPlan {
  name: string;
  price: number;
  trial_days: number;
  test: boolean;
}

const PLANS: Record<string, BillingPlan> = {
  professional: {
    name: "Professional",
    price: 29.0,
    trial_days: 14,
    test: process.env.NODE_ENV !== "production",
  },
  enterprise: {
    name: "Enterprise",
    price: 79.0,
    trial_days: 14,
    test: process.env.NODE_ENV !== "production",
  },
};

/**
 * GET /api/billing
 * Returns the current billing status for the merchant.
 */
router.get("/", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("subscription_status, currency")
      .eq("id", merchantId)
      .single();

    if (error || !merchant) {
      return res.json({ data: { plan: "starter", status: "active" } });
    }

    res.json({
      data: {
        plan: merchant.subscription_status || "starter",
        status: "active",
        currency: merchant.currency || "USD",
      },
    });
  } catch (err) {
    console.error("Billing fetch error:", err);
    res.status(500).json({ error: "Failed to fetch billing info" });
  }
});

/**
 * POST /api/billing/subscribe
 * Creates a Shopify recurring application charge for the selected plan.
 * Returns a confirmation_url to redirect the merchant to Shopify's approval page.
 */
router.post("/subscribe", async (req, res) => {
  const { merchantId, shop } = res.locals;
  const { plan } = req.body;

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ error: "Invalid plan. Choose 'professional' or 'enterprise'." });
  }

  const selectedPlan = PLANS[plan];

  try {
    // Get merchant's access token
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("access_token")
      .eq("id", merchantId)
      .single();

    if (merchantError || !merchant?.access_token) {
      return res.status(500).json({ error: "Merchant access token not found" });
    }

    // Create a recurring application charge via Shopify REST API
    const chargeResponse = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": merchant.access_token,
        },
        body: JSON.stringify({
          recurring_application_charge: {
            name: `MeasureRight ${selectedPlan.name}`,
            price: selectedPlan.price,
            trial_days: selectedPlan.trial_days,
            test: selectedPlan.test,
            return_url: `${process.env.HOST || "https://measureright-production-4bef.up.railway.app"}/api/billing/confirm?shop=${shop}&plan=${plan}`,
          },
        }),
      }
    );

    if (!chargeResponse.ok) {
      const errText = await chargeResponse.text();
      console.error("Shopify charge creation failed:", errText);
      return res.status(502).json({ error: "Failed to create billing charge" });
    }

    const chargeData = (await chargeResponse.json()) as {
      recurring_application_charge: {
        id: number;
        confirmation_url: string;
      };
    };

    const charge = chargeData.recurring_application_charge;

    res.json({
      data: {
        charge_id: charge.id,
        confirmation_url: charge.confirmation_url,
      },
    });
  } catch (err) {
    console.error("Billing subscribe error:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

/**
 * GET /api/billing/confirm
 * Shopify redirects here after the merchant approves/declines the charge.
 * Activates the charge and updates the merchant's subscription status.
 */
router.get("/confirm", async (req, res) => {
  const { shop, plan, charge_id } = req.query as Record<string, string>;

  if (!shop || !charge_id) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("id, access_token")
      .eq("shop_domain", shop)
      .single();

    if (merchantError || !merchant?.access_token) {
      return res.status(500).json({ error: "Merchant not found" });
    }

    // Check charge status
    const chargeResponse = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges/${charge_id}.json`,
      {
        headers: { "X-Shopify-Access-Token": merchant.access_token },
      }
    );

    if (!chargeResponse.ok) {
      return res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?billing=error`);
    }

    const chargeData = (await chargeResponse.json()) as {
      recurring_application_charge: { status: string };
    };

    const chargeStatus = chargeData.recurring_application_charge.status;

    if (chargeStatus === "accepted") {
      // Activate the charge
      await fetch(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges/${charge_id}/activate.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": merchant.access_token,
          },
        }
      );

      // Update merchant subscription status
      await supabase
        .from("merchants")
        .update({
          subscription_status: plan || "professional",
          updated_at: new Date().toISOString(),
        })
        .eq("id", merchant.id);

      return res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?billing=success`);
    } else {
      // Charge was declined
      return res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?billing=declined`);
    }
  } catch (err) {
    console.error("Billing confirm error:", err);
    return res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?billing=error`);
  }
});

export default router;
