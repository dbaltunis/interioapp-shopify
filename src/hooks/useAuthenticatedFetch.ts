import { useCallback } from "react";

/**
 * Returns a fetch wrapper that injects the Shopify session token.
 * When running outside Shopify admin (local dev), it falls back to regular fetch.
 */
export function useAuthenticatedFetch() {
  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    // In Shopify embedded context, App Bridge injects a session token
    // For local dev, we skip auth
    const token = await getSessionToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }, []);
}

async function getSessionToken(): Promise<string | null> {
  // App Bridge v4 exposes shopify global in embedded context
  const shopify = (window as unknown as { shopify?: { idToken(): Promise<string> } }).shopify;
  if (shopify?.idToken) {
    return shopify.idToken();
  }
  return null;
}
