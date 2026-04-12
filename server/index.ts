import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";
import { authenticateRequest } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { runMigrations } from "./lib/migrate.js";

// Route imports
import authRoutes from "./routes/auth.js";
import webhookRoutes, { captureRawBody } from "./routes/webhooks.js";
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
import interioappRoutes from "./routes/interioapp.js";
import proxyRoutes from "./routes/proxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || "3001", 10);
const isProduction = process.env.NODE_ENV === "production";

const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(cookieParser());

// Shopify embedded apps MUST set frame-ancestors to allow iframe embedding
app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors https://*.myshopify.com https://admin.shopify.com;"
  );
  res.removeHeader("X-Frame-Options");
  next();
});

// Webhook routes must be registered BEFORE express.json() to capture raw body for HMAC verification
app.use("/api/webhooks", express.json({ verify: captureRawBody }), webhookRoutes);

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// OAuth routes (public — handles install + callback)
app.use("/api/auth", authRoutes);

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
app.use("/api/interioapp", authenticateRequest, interioappRoutes);

// Public proxy routes (no auth — Shopify App Proxy forwards storefront requests here)
app.use("/proxy", proxyRoutes);

// Serve frontend — in production try dist/client, otherwise redirect to auth
if (isProduction) {
  const clientDir = resolve(__dirname, "../dist/client");
  if (existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get("*", (_req, res) => {
      res.sendFile(resolve(clientDir, "index.html"));
    });
  } else {
    // No built frontend — redirect Shopify embedded app requests to OAuth
    app.get("*", (req, res) => {
      const shop = req.query.shop as string;
      if (shop) {
        res.redirect(`/api/auth?shop=${shop}`);
      } else {
        res.status(200).json({ status: "ok", service: "MeasureRight API" });
      }
    });
  }
}

// Error handler
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`MeasureRight server running on port ${PORT}`);
  await runMigrations().catch((err) => console.error("Migration check failed:", err));
});
