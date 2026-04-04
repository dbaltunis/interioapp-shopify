import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppBridgeProvider } from "./providers/AppBridgeProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { Toaster } from "./components/ui/sonner";

// Pages (will be created in later phases)
import HomePage from "./pages/HomePage";
import ShopifyProductsPage from "./pages/ShopifyProductsPage";
import TemplatesPage from "./pages/TemplatesPage";
import TemplateDetailPage from "./pages/TemplateDetailPage";
import PriceListsPage from "./pages/PriceListsPage";
import PriceListDetailPage from "./pages/PriceListDetailPage";
import VendorsPage from "./pages/VendorsPage";
import FabricsPage from "./pages/FabricsPage";
import QuotesPage from "./pages/QuotesPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shopify-products" element={<ShopifyProductsPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/templates/new" element={<TemplateDetailPage />} />
      <Route path="/templates/:id" element={<TemplateDetailPage />} />
      <Route path="/price-lists" element={<PriceListsPage />} />
      <Route path="/price-lists/new" element={<PriceListDetailPage />} />
      <Route path="/price-lists/:id" element={<PriceListDetailPage />} />
      <Route path="/vendors" element={<VendorsPage />} />
      <Route path="/fabrics" element={<FabricsPage />} />
      <Route path="/quotes" element={<QuotesPage />} />
      <Route path="/quotes/:id" element={<QuoteDetailPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppBridgeProvider>
        <QueryProvider>
          <nav className="sr-only">
            {/* Shopify App Bridge NavMenu renders in the Shopify admin frame */}
            {/* These links are for App Bridge NavMenu integration */}
          </nav>
          <main className="p-4 max-w-7xl mx-auto">
            <AppRoutes />
          </main>
          <Toaster />
        </QueryProvider>
      </AppBridgeProvider>
    </BrowserRouter>
  );
}
