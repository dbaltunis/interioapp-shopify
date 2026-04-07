import { useState, useEffect, type ReactNode } from "react";
import { Page, Spinner, BlockStack, Text } from "@shopify/polaris";

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app with Shopify App Bridge context.
 * When running inside Shopify admin, waits for App Bridge to be ready before rendering.
 * Outside Shopify (local dev), renders children immediately.
 */
export function AppBridgeProvider({ children }: Props) {
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host") || "";
  const isEmbedded = host && params.get("embedded") === "1";

  // If not embedded, render immediately (dev mode)
  if (!isEmbedded) {
    return <>{children}</>;
  }

  return <AppBridgeGate>{children}</AppBridgeGate>;
}

function AppBridgeGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const shopify = (window as any).shopify;
    if (shopify) {
      // App Bridge v4 — wait for ready
      if (typeof shopify.ready === "function") {
        shopify.ready().then(() => setReady(true)).catch(() => setReady(true));
      } else {
        // Fallback: if ready() doesn't exist, just render
        setReady(true);
      }
    } else {
      // No App Bridge at all — render anyway
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <Page>
        <BlockStack align="center" inlineAlign="center">
          <Spinner size="large" />
          <Text as="p" variant="bodySm" tone="subdued">Loading...</Text>
        </BlockStack>
      </Page>
    );
  }

  return <>{children}</>;
}
