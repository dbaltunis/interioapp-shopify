import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  // Placeholder — billing plan info
  res.json({
    data: {
      plan: "starter",
      status: "active",
    },
  });
});

router.post("/subscribe", async (_req, res) => {
  // Placeholder — in production, create Shopify recurring charge
  res.json({ data: { confirmation_url: "#" } });
});

export default router;
