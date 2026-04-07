import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    // Check if fabrics already exist
    const { count } = await supabase
      .from("fabrics")
      .select("id", { count: "exact" })
      .eq("merchant_id", merchantId);

    if (count && count > 0) {
      return res.json({ data: { message: "Demo data already exists", seeded: false } });
    }

    // Seed vendors
    const { data: vendors } = await supabase
      .from("vendors")
      .insert([
        {
          merchant_id: merchantId,
          name: "Blinds Direct",
          contact_name: "John Smith",
          email: "orders@blindsdirect.com",
          phone: "+44 7700 900000",
        },
        {
          merchant_id: merchantId,
          name: "Fabric World",
          contact_name: "Sarah Jones",
          email: "sales@fabricworld.com",
          phone: "+44 7700 900001",
        },
      ])
      .select();

    // Seed fabrics
    const { data: fabrics } = await supabase
      .from("fabrics")
      .insert([
        {
          merchant_id: merchantId,
          name: "Premium Blockout",
          category: "blockout",
          colours: ["White", "Ivory", "Silver", "Charcoal", "Navy"],
          roll_width: 1800,
          price_per_sqm: 35,
          price_per_linear_metre: 63,
          surcharge: 0,
        },
        {
          merchant_id: merchantId,
          name: "Light Filtering",
          category: "sheer",
          colours: ["White", "Cream", "Sand", "Grey"],
          roll_width: 1500,
          price_per_sqm: 25,
          price_per_linear_metre: 37.5,
          surcharge: 0,
        },
        {
          merchant_id: merchantId,
          name: "Sunscreen 5%",
          category: "sunscreen",
          colours: ["White", "Bone", "Grey", "Charcoal", "Black"],
          roll_width: 2000,
          price_per_sqm: 45,
          price_per_linear_metre: 90,
          surcharge: 5,
        },
      ])
      .select();

    // Seed templates
    const { count: templateCount } = await supabase
      .from("product_templates")
      .select("id", { count: "exact" })
      .eq("merchant_id", merchantId);

    let templates: { id: string }[] = [];
    if (!templateCount || templateCount === 0) {
      const { data: newTemplates } = await supabase
        .from("product_templates")
        .insert([
          {
            merchant_id: merchantId,
            code: "roller-blind",
            name: "Roller Blind",
            category: "blind",
            pricing_model: "grid",
            min_width: 300,
            max_width: 3000,
            min_drop: 300,
            max_drop: 3000,
            vendor_id: vendors?.[0]?.id || null,
            wastage_percent: 5,
            labour_cost: 15,
            installation_cost: 25,
            options: [
              {
                key: "control_side",
                label: "Control Side",
                type: "select",
                required: true,
                choices: [
                  { value: "left", label: "Left", price_type: "none", price_value: 0 },
                  { value: "right", label: "Right", price_type: "none", price_value: 0 },
                ],
              },
              {
                key: "motor",
                label: "Motorisation",
                type: "select",
                required: false,
                choices: [
                  { value: "manual", label: "Manual (Chain)", price_type: "none", price_value: 0 },
                  { value: "standard_motor", label: "Standard Motor", price_type: "flat", price_value: 120 },
                  { value: "smart_motor", label: "Smart Motor (WiFi)", price_type: "flat", price_value: 220 },
                ],
              },
              {
                key: "cassette",
                label: "Cassette / Headrail",
                type: "select",
                required: false,
                choices: [
                  { value: "open", label: "Open Roll", price_type: "none", price_value: 0 },
                  { value: "fascia", label: "Fascia Cover", price_type: "flat", price_value: 25 },
                  { value: "cassette", label: "Full Cassette", price_type: "flat", price_value: 55 },
                ],
              },
            ],
          },
          {
            merchant_id: merchantId,
            code: "venetian-blind",
            name: "Venetian Blind",
            category: "blind",
            pricing_model: "grid",
            min_width: 250,
            max_width: 2400,
            min_drop: 300,
            max_drop: 2400,
            vendor_id: vendors?.[0]?.id || null,
            wastage_percent: 3,
            labour_cost: 20,
            installation_cost: 30,
            options: [
              {
                key: "slat_size",
                label: "Slat Size",
                type: "select",
                required: true,
                choices: [
                  { value: "25mm", label: "25mm", price_type: "none", price_value: 0 },
                  { value: "50mm", label: "50mm", price_type: "flat", price_value: 15 },
                ],
              },
              {
                key: "control_side",
                label: "Control Side",
                type: "select",
                required: true,
                choices: [
                  { value: "left", label: "Left", price_type: "none", price_value: 0 },
                  { value: "right", label: "Right", price_type: "none", price_value: 0 },
                ],
              },
            ],
          },
          {
            merchant_id: merchantId,
            code: "curtains",
            name: "Curtains",
            category: "curtain",
            pricing_model: "sqm",
            min_width: 500,
            max_width: 6000,
            min_drop: 1000,
            max_drop: 3500,
            vendor_id: vendors?.[1]?.id || null,
            wastage_percent: 10,
            labour_cost: 25,
            installation_cost: 35,
            options: [
              {
                key: "heading_style",
                label: "Heading Style",
                type: "select",
                required: true,
                choices: [
                  { value: "pencil_pleat", label: "Pencil Pleat", price_type: "multiplier", price_value: 1.0 },
                  { value: "eyelet", label: "Eyelet", price_type: "multiplier", price_value: 1.15 },
                  { value: "pinch_pleat", label: "Pinch Pleat", price_type: "multiplier", price_value: 1.35 },
                  { value: "wave", label: "Wave / S-Fold", price_type: "multiplier", price_value: 1.50 },
                  { value: "goblet", label: "Goblet Pleat", price_type: "multiplier", price_value: 1.45 },
                ],
              },
              {
                key: "lining",
                label: "Lining",
                type: "select",
                required: false,
                choices: [
                  { value: "none", label: "Unlined", price_type: "none", price_value: 0 },
                  { value: "standard", label: "Standard Lining", price_type: "per_sqm", price_value: 12 },
                  { value: "blockout", label: "Blockout Lining", price_type: "per_sqm", price_value: 18 },
                  { value: "thermal", label: "Thermal Lining", price_type: "per_sqm", price_value: 22 },
                  { value: "interlining", label: "Interlining", price_type: "per_sqm", price_value: 30 },
                ],
              },
              {
                key: "track",
                label: "Track / Pole",
                type: "select",
                required: false,
                choices: [
                  { value: "none", label: "No Track (fabric only)", price_type: "none", price_value: 0 },
                  { value: "standard_track", label: "Standard Track", price_type: "per_linear_metre", price_value: 15 },
                  { value: "heavy_duty", label: "Heavy Duty Track", price_type: "per_linear_metre", price_value: 28 },
                  { value: "motorised_track", label: "Motorised Track", price_type: "per_linear_metre", price_value: 65 },
                  { value: "wooden_pole", label: "Wooden Pole", price_type: "per_linear_metre", price_value: 35 },
                  { value: "metal_pole", label: "Metal Pole", price_type: "per_linear_metre", price_value: 42 },
                ],
              },
              {
                key: "tiebacks",
                label: "Tiebacks",
                type: "select",
                required: false,
                choices: [
                  { value: "none", label: "No Tiebacks", price_type: "none", price_value: 0 },
                  { value: "fabric", label: "Fabric Tiebacks (pair)", price_type: "flat", price_value: 35 },
                  { value: "rope", label: "Rope Tiebacks (pair)", price_type: "flat", price_value: 25 },
                  { value: "tassel", label: "Tassel Tiebacks (pair)", price_type: "flat", price_value: 45 },
                ],
              },
            ],
          },
        ])
        .select();
      templates = newTemplates || [];
    } else {
      const { data: existingTemplates } = await supabase
        .from("product_templates")
        .select("id")
        .eq("merchant_id", merchantId);
      templates = existingTemplates || [];
    }

    // Seed pricing grid for roller blind (grid model)
    if (templates?.[0]) {
      await supabase.from("pricing_grids").insert({
        merchant_id: merchantId,
        product_template_id: templates[0].id,
        fabric_id: fabrics?.[0]?.id || null,
        width_bands: [600, 900, 1200, 1500, 1800, 2100, 2400, 3000],
        drop_bands: [1000, 1200, 1500, 1800, 2000, 2200, 2500, 3000],
        prices: [
          85, 95, 110, 125, 140, 160, 180, 220,
          90, 100, 120, 135, 150, 170, 195, 240,
          100, 115, 135, 155, 175, 195, 220, 270,
          115, 130, 155, 175, 200, 225, 250, 310,
          125, 140, 170, 195, 220, 250, 280, 345,
          135, 155, 185, 210, 240, 270, 305, 380,
          150, 170, 205, 235, 270, 305, 340, 425,
          175, 200, 240, 275, 315, 360, 400, 500,
        ],
      });
    }

    // Seed pricing grid for venetian blind (grid model)
    if (templates?.[1]) {
      await supabase.from("pricing_grids").insert({
        merchant_id: merchantId,
        product_template_id: templates[1].id,
        fabric_id: null,
        width_bands: [600, 900, 1200, 1500, 1800, 2100, 2400],
        drop_bands: [600, 900, 1200, 1500, 1800, 2100, 2400],
        prices: [
          65, 75, 90, 105, 120, 140, 160,
          70, 82, 98, 115, 132, 155, 178,
          78, 92, 110, 130, 150, 175, 200,
          88, 105, 125, 148, 172, 200, 230,
          100, 120, 145, 170, 198, 230, 265,
          115, 138, 165, 195, 228, 265, 305,
          132, 158, 190, 225, 262, 305, 350,
        ],
      });
    }

    // Seed pricing grid for curtains (sqm model)
    if (templates?.[2]) {
      await supabase.from("pricing_grids").insert({
        merchant_id: merchantId,
        product_template_id: templates[2].id,
        price_per_sqm: 85,
        price_per_linear_metre: 145,
        width_bands: [],
        drop_bands: [],
        prices: [],
      });
    }

    // Seed a quote
    await supabase.from("quotes").insert({
      merchant_id: merchantId,
      customer_name: "Jane Smith",
      customer_email: "jane@example.com",
      customer_phone: "+44 7700 900123",
      status: "sent",
      total_ex_tax: 250.85,
      total_tax: 44.15,
      total_inc_tax: 295,
      line_items: [
        {
          template_code: "roller-blind",
          template_name: "Roller Blind",
          width: 1200,
          drop: 1500,
          fabric: "Premium Blockout",
          colour: "Silver",
          quantity: 2,
          unit_price: 135,
          line_total: 270,
        },
        {
          template_code: "roller-blind",
          template_name: "Roller Blind",
          width: 600,
          drop: 1000,
          fabric: "Light Filtering",
          colour: "White",
          quantity: 1,
          unit_price: 25,
          line_total: 25,
        },
      ],
    });

    res.json({ data: { message: "Demo data seeded successfully", seeded: true } });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: "Failed to seed data" });
  }
});

export default router;
