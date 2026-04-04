import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { authenticateRequest } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";

// Route imports
import shopRoutes from "./routes/shop.js";
import templateRoutes from "./routes/templates.js";
import gridRoutes from "./routes/grids.js";
import fabricRoutes from "./routes/fabrics.js";
import vendorRoutes from "./routes/vendors.js";
import quoteRoutes from "./routes/quotes.js";
import workOrderRoutes from "./routes/work-orders.js";
import productRoutes from "./routes/products.js";
import analyticsRoutes from "./routes/analytics.js";
import settingsRoutes from "./routes/settings.js";
import billingRoutes from "./routes/billing.js";
import seedRoutes from "./routes/seed.js";
import proxyRoutes from "./routes/proxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || "3001", 10);
const isProduction = process.env.NODE_ENV === "production";

const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Authenticated API routes
app.use("/api/shop", authenticateRequest, shopRoutes);
app.use("/api/templates", authenticateRequest, templateRoutes);
app.use("/api/grids", authenticateRequest, gridRoutes);
app.use("/api/fabrics", authenticateRequest, fabricRoutes);
app.use("/api/vendors", authenticateRequest, vendorRoutes);
app.use("/api/quotes", authenticateRequest, quoteRoutes);
app.use("/api/work-orders", authenticateRequest, workOrderRoutes);
app.use("/api/products", authenticateRequest, productRoutes);
app.use("/api/analytics", authenticateRequest, analyticsRoutes);
app.use("/api/settings", authenticateRequest, settingsRoutes);
app.use("/api/billing", authenticateRequest, billingRoutes);
app.use("/api/seed", authenticateRequest, seedRoutes);

// Public proxy routes (no auth — Shopify App Proxy forwards storefront requests here)
app.use("/proxy", proxyRoutes);

// In production, serve the built Vite app
if (isProduction) {
  const clientDir = resolve(__dirname, "../client");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.sendFile(resolve(clientDir, "index.html"));
  });
}

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MeasureRight server running on port ${PORT}`);
  if (!isProduction) {
    console.log(`API: http://localhost:${PORT}/api/health`);
    console.log(`Frontend dev server should run on http://localhost:5173`);
  }
});
