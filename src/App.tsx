import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import enTranslations from "@shopify/polaris/locales/en.json";
import { AppBridgeProvider } from "./providers/AppBridgeProvider";
import { QueryProvider } from "./providers/QueryProvider";

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
        <AppProvider i18n={enTranslations}>
          <QueryProvider>
            <NavMenu>
              <a href="/" rel="home">Home</a>
              <a href="/templates">Templates</a>
              <a href="/price-lists">Price Lists</a>
              <a href="/fabrics">Fabrics</a>
              <a href="/vendors">Vendors</a>
              <a href="/quotes">Quotes</a>
              <a href="/orders">Work Orders</a>
              <a href="/shopify-products">Products</a>
              <a href="/analytics">Analytics</a>
              <a href="/settings">Settings</a>
            </NavMenu>
            <AppRoutes />
          </QueryProvider>
        </AppProvider>
      </AppBridgeProvider>
    </BrowserRouter>
  );
}
