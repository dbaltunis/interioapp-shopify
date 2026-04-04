import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  // Placeholder — settings could be stored in a JSONB column on merchants
  res.json({
    data: {
      currency: "USD",
      units: "metric",
    },
  });
});

router.put("/", async (_req, res) => {
  // Placeholder
  res.json({ data: { success: true } });
});

export default router;
