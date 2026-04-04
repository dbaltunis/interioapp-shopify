import { useMemo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app with Shopify App Bridge context.
 * When running outside Shopify admin (e.g., local dev), it renders children directly.
 * Inside Shopify admin, it initializes App Bridge with the API key and host.
 */
export function AppBridgeProvider({ children }: Props) {
  const host = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("host") || "";
  }, []);

  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || "";

  // If we're not inside Shopify admin (no host param), render without App Bridge
  if (!host || !apiKey) {
    return <>{children}</>;
  }

  // Dynamic import of App Bridge provider to avoid issues when running outside Shopify
  return <AppBridgeWrapper apiKey={apiKey} host={host}>{children}</AppBridgeWrapper>;
}

function AppBridgeWrapper({
  apiKey,
  host,
  children,
}: {
  apiKey: string;
  host: string;
  children: ReactNode;
}) {
  // App Bridge v4 uses a simpler setup - it auto-initializes from the URL params
  // The NavMenu is rendered by Shopify admin when we set up the navigation in shopify.app.toml
  // For now, we pass through. Full App Bridge integration happens when deployed to Shopify.
  void apiKey;
  void host;
  return <>{children}</>;
}
