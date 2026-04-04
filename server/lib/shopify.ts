import { shopifyApi, LATEST_API_VERSION, LogSeverity } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";

const isProd = process.env.NODE_ENV === "production";

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: (process.env.SCOPES || "read_products,write_products,read_orders,write_draft_orders,read_themes,write_themes").split(","),
  hostName: (process.env.HOST || "https://measureright-production-4bef.up.railway.app").replace(/^https?:\/\//, ""),
  hostScheme: "https",
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  logger: {
    level: isProd ? LogSeverity.Warning : LogSeverity.Info,
  },
});
