import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { merchantId } = res.locals;

  try {
    // Check if data already exists
    const { count } = await supabase
      .from("product_templates")
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
          contact_email: "orders@blindsdirect.com",
          contact_phone: "+44 7700 900000",
          address: "123 Factory Lane, Manchester, UK",
        },
        {
          merchant_id: merchantId,
          name: "Fabric World",
          contact_email: "sales@fabricworld.com",
          contact_phone: "+44 7700 900001",
          address: "456 Textile Road, Birmingham, UK",
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
    const { data: templates } = await supabase
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
        },
      ])
      .select();

    // Seed a pricing grid for roller blind
    if (templates?.[0]) {
      await supabase.from("pricing_grids").insert({
        merchant_id: merchantId,
        product_template_id: templates[0].id,
        fabric_id: fabrics?.[0]?.id || null,
        width_bands: [600, 900, 1200, 1500, 1800, 2100, 2400, 3000],
        drop_bands: [1000, 1200, 1500, 1800, 2000, 2200, 2500, 3000],
        prices: [
          // 8 widths × 8 drops = 64 prices (row-major: all widths for drop[0], then drop[1], etc.)
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

    // Seed a quote
    await supabase.from("quotes").insert({
      merchant_id: merchantId,
      customer_name: "Jane Smith",
      customer_email: "jane@example.com",
      customer_phone: "+44 7700 900123",
      status: "sent",
      total: 295,
      items: [
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
