import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import {
  testConnection,
  getCatalog,
  getOptions,
  getEstimate,
  createLead,
  createProject,
  type InterioAppCredentials,
  type InterioFabric,
  type InterioTemplate,
} from "../lib/interioapp.js";

const router = Router();

// ─── Helper: Get stored credentials ──────────────────────────

async function getCredentials(merchantId: string): Promise<InterioAppCredentials | null> {
  const { data } = await supabase
    .from("merchants")
    .select("interioapp_account_id, interioapp_api_key")
    .eq("id", merchantId)
    .single();

  if (!data?.interioapp_account_id || !data?.interioapp_api_key) {
    return null;
  }

  return {
    account_id: data.interioapp_account_id,
    api_key: data.interioapp_api_key,
  };
}

function requireCredentials(credentials: InterioAppCredentials | null): asserts credentials is InterioAppCredentials {
  if (!credentials) {
    const err = new Error("InterioApp not connected. Configure your account ID and API key in Settings.");
    (err as any).status = 400;
    throw err;
  }
}

// ─── Settings & Connection ───────────────────────────────────

/**
 * GET /api/interioapp/status
 * Returns connection status and credentials (masked).
 */
router.get("/status", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const { data } = await supabase
      .from("merchants")
      .select("interioapp_account_id, interioapp_api_key, interioapp_last_sync")
      .eq("id", merchantId)
      .single();

    const connected = !!(data?.interioapp_account_id && data?.interioapp_api_key);

    res.json({
      data: {
        connected,
        account_id: data?.interioapp_account_id || "",
        api_key_set: !!data?.interioapp_api_key,
        api_key_masked: data?.interioapp_api_key
          ? `${data.interioapp_api_key.slice(0, 6)}...${data.interioapp_api_key.slice(-4)}`
          : "",
        last_sync: data?.interioapp_last_sync || null,
      },
    });
  } catch (err) {
    console.error("InterioApp status error:", err);
    res.status(500).json({ error: "Failed to check connection status" });
  }
});

/**
 * POST /api/interioapp/connect
 * Save credentials and test the connection.
 */
router.post("/connect", async (req, res) => {
  const { merchantId } = res.locals;
  const { account_id, api_key } = req.body;

  if (!account_id || !api_key) {
    return res.status(400).json({ error: "Account ID and API key are required" });
  }

  try {
    // Test connection first
    const result = await testConnection({ account_id, api_key });

    if (!result.success) {
      return res.status(400).json({
        error: `Connection failed: ${result.error}`,
      });
    }

    // Save credentials
    const { error } = await supabase
      .from("merchants")
      .update({
        interioapp_account_id: account_id,
        interioapp_api_key: api_key,
        updated_at: new Date().toISOString(),
      })
      .eq("id", merchantId);

    if (error) throw error;

    res.json({
      data: {
        success: true,
        templates_count: result.templates_count,
        fabrics_count: result.fabrics_count,
      },
    });
  } catch (err) {
    console.error("InterioApp connect error:", err);
    res.status(500).json({ error: "Failed to save connection" });
  }
});

/**
 * POST /api/interioapp/disconnect
 * Remove stored credentials.
 */
router.post("/disconnect", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const { error } = await supabase
      .from("merchants")
      .update({
        interioapp_account_id: null,
        interioapp_api_key: null,
        interioapp_last_sync: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", merchantId);

    if (error) throw error;

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("InterioApp disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

/**
 * POST /api/interioapp/test
 * Test connection with current saved credentials.
 */
router.post("/test", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const result = await testConnection(credentials);
    res.json({ data: result });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Browse InterioApp Data (Read-Only) ──────────────────────

/**
 * GET /api/interioapp/catalog
 * Browse the InterioApp fabric catalog.
 */
router.get("/catalog", async (req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const { page, per_page, category, search } = req.query;
    const data = await getCatalog(credentials, {
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
      category: category as string | undefined,
      search: search as string | undefined,
    });

    res.json({ data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * GET /api/interioapp/options
 * Get templates, headings, linings, inventory options from InterioApp.
 */
router.get("/options", async (req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const { template_id, category } = req.query;
    const data = await getOptions(credentials, {
      template_id: template_id as string | undefined,
      category: category as string | undefined,
    });

    res.json({ data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /api/interioapp/estimate
 * Get a price estimate from InterioApp for given dimensions + fabric.
 */
router.post("/estimate", async (req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const data = await getEstimate(credentials, req.body);
    res.json({ data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Sync Operations ─────────────────────────────────────────

/**
 * POST /api/interioapp/sync/fabrics
 * Pull fabrics from InterioApp and upsert into local database.
 */
router.post("/sync/fabrics", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    // Fetch all fabrics from InterioApp (paginated)
    let allFabrics: InterioFabric[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await getCatalog(credentials, { page, per_page: perPage });
      allFabrics = allFabrics.concat(result.fabrics || []);
      hasMore = allFabrics.length < result.total;
      page++;
      // Safety valve
      if (page > 50) break;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const fabric of allFabrics) {
      // Check if this fabric already exists (match by name + category)
      const { data: existing } = await supabase
        .from("fabrics")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("name", fabric.name)
        .eq("category", fabric.category)
        .maybeSingle();

      const fabricData = {
        merchant_id: merchantId,
        name: fabric.name,
        category: fabric.category || "general",
        colours: fabric.colours || [],
        roll_width: fabric.roll_width || 0,
        price_per_sqm: fabric.price_per_sqm || 0,
        price_per_linear_metre: fabric.price_per_linear_metre || 0,
        surcharge: fabric.surcharge || 0,
        interioapp_id: fabric.id,
      };

      if (existing) {
        const { error } = await supabase
          .from("fabrics")
          .update(fabricData)
          .eq("id", existing.id);
        if (error) {
          skipped++;
          console.error("Fabric update error:", error);
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from("fabrics")
          .insert(fabricData);
        if (error) {
          skipped++;
          console.error("Fabric insert error:", error);
        } else {
          created++;
        }
      }
    }

    // Update last sync timestamp
    await supabase
      .from("merchants")
      .update({ interioapp_last_sync: new Date().toISOString() })
      .eq("id", merchantId);

    res.json({
      data: {
        total: allFabrics.length,
        created,
        updated,
        skipped,
      },
    });
  } catch (err: any) {
    console.error("Fabric sync error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /api/interioapp/sync/templates
 * Pull templates from InterioApp and upsert into local database.
 */
router.post("/sync/templates", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const result = await getOptions(credentials);
    const templates: InterioTemplate[] = result.templates || [];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Map InterioApp categories to MeasureRight categories
    const categoryMap: Record<string, string> = {
      curtain: "curtain",
      curtains: "curtain",
      roman_blind: "blind",
      roller_blind: "blind",
      venetian_blind: "blind",
      cellular_shade: "blind",
      vertical_blind: "blind",
      shutter: "shutter",
      awning: "awning",
    };

    // Map InterioApp pricing models to MeasureRight
    const pricingModelMap: Record<string, string> = {
      pricing_grid: "grid",
      grid: "grid",
      per_meter_square: "sqm",
      per_sqm: "sqm",
      sqm: "sqm",
      per_running_metre: "linear_metre",
      per_linear_metre: "linear_metre",
      linear_metre: "linear_metre",
      per_width_drop: "area",
      area: "area",
      per_curtain: "fixed",
      fixed: "fixed",
      fixed_price: "fixed",
    };

    for (const tpl of templates) {
      // Check if already exists (match by code)
      const { data: existing } = await supabase
        .from("product_templates")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("code", tpl.code)
        .maybeSingle();

      const category = categoryMap[tpl.category?.toLowerCase()] || "blind";
      const pricingModel = pricingModelMap[tpl.pricing_model?.toLowerCase()] || "grid";

      const templateData = {
        merchant_id: merchantId,
        code: tpl.code,
        name: tpl.name,
        category,
        pricing_model: pricingModel,
        min_width: tpl.min_width || 300,
        max_width: tpl.max_width || 5000,
        min_drop: tpl.min_drop || 300,
        max_drop: tpl.max_drop || 4000,
        options: tpl.options || null,
        dimension_fields: tpl.dimension_fields || null,
        labels: tpl.labels || null,
        interioapp_id: tpl.id,
      };

      if (existing) {
        const { error } = await supabase
          .from("product_templates")
          .update(templateData)
          .eq("id", existing.id);
        if (error) {
          skipped++;
          console.error("Template update error:", error);
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from("product_templates")
          .insert(templateData);
        if (error) {
          skipped++;
          console.error("Template insert error:", error);
        } else {
          created++;
        }
      }
    }

    // Update last sync timestamp
    await supabase
      .from("merchants")
      .update({ interioapp_last_sync: new Date().toISOString() })
      .eq("id", merchantId);

    res.json({
      data: {
        total: templates.length,
        created,
        updated,
        skipped,
      },
    });
  } catch (err: any) {
    console.error("Template sync error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /api/interioapp/sync/all
 * Full sync: fabrics + templates from InterioApp.
 */
router.post("/sync/all", async (req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    // Run both syncs in parallel by calling internal logic
    // We replicate the fetch-and-upsert logic inline for atomicity

    // 1. Fetch everything from InterioApp
    const [catalogResult, optionsResult] = await Promise.all([
      (async () => {
        let allFabrics: InterioFabric[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const r = await getCatalog(credentials, { page, per_page: 100 });
          allFabrics = allFabrics.concat(r.fabrics || []);
          hasMore = allFabrics.length < r.total;
          page++;
          if (page > 50) break;
        }
        return allFabrics;
      })(),
      getOptions(credentials),
    ]);

    const fabrics = catalogResult;
    const templates = optionsResult.templates || [];

    // 2. Sync fabrics
    const fabricStats = { created: 0, updated: 0, skipped: 0 };
    for (const fabric of fabrics) {
      const { data: existing } = await supabase
        .from("fabrics")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("name", fabric.name)
        .eq("category", fabric.category)
        .maybeSingle();

      const fabricData = {
        merchant_id: merchantId,
        name: fabric.name,
        category: fabric.category || "general",
        colours: fabric.colours || [],
        roll_width: fabric.roll_width || 0,
        price_per_sqm: fabric.price_per_sqm || 0,
        price_per_linear_metre: fabric.price_per_linear_metre || 0,
        surcharge: fabric.surcharge || 0,
        interioapp_id: fabric.id,
      };

      if (existing) {
        const { error } = await supabase.from("fabrics").update(fabricData).eq("id", existing.id);
        error ? fabricStats.skipped++ : fabricStats.updated++;
      } else {
        const { error } = await supabase.from("fabrics").insert(fabricData);
        error ? fabricStats.skipped++ : fabricStats.created++;
      }
    }

    // 3. Sync templates
    const categoryMap: Record<string, string> = {
      curtain: "curtain", curtains: "curtain",
      roman_blind: "blind", roller_blind: "blind", venetian_blind: "blind",
      cellular_shade: "blind", vertical_blind: "blind",
      shutter: "shutter", awning: "awning",
    };
    const pricingModelMap: Record<string, string> = {
      pricing_grid: "grid", grid: "grid",
      per_meter_square: "sqm", per_sqm: "sqm", sqm: "sqm",
      per_running_metre: "linear_metre", per_linear_metre: "linear_metre", linear_metre: "linear_metre",
      per_width_drop: "area", area: "area",
      per_curtain: "fixed", fixed: "fixed", fixed_price: "fixed",
    };

    const templateStats = { created: 0, updated: 0, skipped: 0 };
    for (const tpl of templates) {
      const { data: existing } = await supabase
        .from("product_templates")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("code", tpl.code)
        .maybeSingle();

      const templateData = {
        merchant_id: merchantId,
        code: tpl.code,
        name: tpl.name,
        category: categoryMap[tpl.category?.toLowerCase()] || "blind",
        pricing_model: pricingModelMap[tpl.pricing_model?.toLowerCase()] || "grid",
        min_width: tpl.min_width || 300,
        max_width: tpl.max_width || 5000,
        min_drop: tpl.min_drop || 300,
        max_drop: tpl.max_drop || 4000,
        options: tpl.options || null,
        dimension_fields: tpl.dimension_fields || null,
        labels: tpl.labels || null,
        interioapp_id: tpl.id,
      };

      if (existing) {
        const { error } = await supabase.from("product_templates").update(templateData).eq("id", existing.id);
        error ? templateStats.skipped++ : templateStats.updated++;
      } else {
        const { error } = await supabase.from("product_templates").insert(templateData);
        error ? templateStats.skipped++ : templateStats.created++;
      }
    }

    // 4. Update last sync
    await supabase
      .from("merchants")
      .update({ interioapp_last_sync: new Date().toISOString() })
      .eq("id", merchantId);

    res.json({
      data: {
        fabrics: { total: fabrics.length, ...fabricStats },
        templates: { total: templates.length, ...templateStats },
        synced_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Full sync error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Push Operations (MeasureRight → InterioApp) ─────────────

/**
 * POST /api/interioapp/push/lead
 * Push a customer lead to InterioApp.
 */
router.post("/push/lead", async (req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const data = await createLead(credentials, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      source: "shopify-measureright",
      notes: req.body.notes,
    });

    res.json({ data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /api/interioapp/push/project
 * Push a quote as a project to InterioApp.
 */
router.post("/push/project", async (req, res) => {
  const { merchantId } = res.locals;

  try {
    const credentials = await getCredentials(merchantId);
    requireCredentials(credentials);

    const { quote_id } = req.body;

    if (!quote_id) {
      return res.status(400).json({ error: "quote_id is required" });
    }

    // Fetch the quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .eq("merchant_id", merchantId)
      .single();

    if (quoteError || !quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    // Map line items to InterioApp project items
    const items = (quote.line_items || []).map((item: any) => ({
      template_id: item.template_code,
      width: item.width,
      drop: item.drop,
      fabric_id: item.fabric || undefined,
      colour: item.colour || undefined,
      quantity: item.quantity || 1,
    }));

    const projectData = {
      customer: {
        name: quote.customer_name,
        email: quote.customer_email,
        phone: quote.customer_phone || undefined,
      },
      items,
      notes: quote.notes || undefined,
      source: "shopify-measureright",
    };

    const data = await createProject(credentials, projectData);

    // Store the InterioApp project reference on the quote
    await supabase
      .from("quotes")
      .update({
        interioapp_project_id: data.id,
        interioapp_project_number: data.project_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote_id);

    res.json({ data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
