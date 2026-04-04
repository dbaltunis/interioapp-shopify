export function showToast(message: string, options?: { isError?: boolean }) {
  const shopify = (window as any).shopify;
  if (shopify?.toast) {
    shopify.toast.show(message, options);
  } else {
    if (options?.isError) {
      console.error(`[Toast Error]: ${message}`);
    } else {
      console.log(`[Toast]: ${message}`);
    }
  }
}
