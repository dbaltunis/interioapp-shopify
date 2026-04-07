import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  Button,
  Badge,
  Banner,
  Box,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { useState } from "react";
import { useApiList } from "@/hooks/useApi";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { showToast } from "@/lib/toast";
import type { ProductTemplate, Quote, WorkOrder } from "@/lib/types";

export default function HomePage() {
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch();
  const { data: templates, isLoading: loadingTemplates, refetch: refetchTemplates } = useApiList<ProductTemplate>("templates");
  const { data: quotes, isLoading: loadingQuotes } = useApiList<Quote>("quotes");
  const { data: orders, isLoading: loadingOrders } = useApiList<WorkOrder>("work-orders");
  const [seeding, setSeeding] = useState(false);

  const hasTemplates = (templates?.length ?? 0) > 0;
  const isLoading = loadingTemplates || loadingQuotes || loadingOrders;

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const json = await fetch("/api/seed");
      if (json.data?.seeded || json.seeded) {
        showToast("Demo products created: Roller Blind, Venetian Blind, and Curtains");
        refetchTemplates();
      } else {
        showToast("Demo data already exists");
      }
    } catch {
      showToast("Failed to create demo data", { isError: true });
    } finally {
      setSeeding(false);
    }
  };

  const stats = [
    { title: "Templates", value: templates?.length ?? 0 },
    { title: "Quotes", value: quotes?.length ?? 0 },
    { title: "Orders", value: orders?.length ?? 0 },
  ];

  const setupSteps = [
    {
      id: "templates",
      label: "1. Set up product templates",
      description: "Product templates define what your customers can configure - dimensions, options, and pricing for each product type.",
      done: hasTemplates,
      action: () => navigate("/templates/new"),
      actionLabel: "Create Template",
    },
    {
      id: "pricing",
      label: "2. Set up pricing",
      description: "Create a pricing grid or set per-sqm rates so the calculator knows what to charge for each size.",
      done: false,
      action: () => navigate("/price-lists/new"),
      actionLabel: "Create Price List",
    },
    {
      id: "products",
      label: "3. Link Shopify products",
      description: "Connect your Shopify products to templates so the calculator appears on the right product pages.",
      done: false,
      action: () => navigate("/shopify-products"),
      actionLabel: "Link Products",
    },
    {
      id: "widget",
      label: "4. Add the calculator to your theme",
      description: "Add the MeasureRight Calculator block to your product page template in the Shopify theme editor.",
      done: false,
      action: null,
      actionLabel: "",
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <Page title="MeasureRight" subtitle="Made-to-measure pricing calculator for Shopify">
      <BlockStack gap="400">
        {/* Welcome banner for new users */}
        {!hasTemplates && !isLoading && (
          <Banner
            title="Welcome to MeasureRight!"
            tone="info"
            action={{ content: "Load demo products", onAction: handleSeedDemo, loading: seeding }}
          >
            <p>
              Get started quickly by loading demo products (Roller Blind, Venetian
              Blind, and Curtains) with sample pricing, or follow the setup guide
              below to create your own.
            </p>
          </Banner>
        )}

        {/* Setup Guide */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Setup Guide</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {completedSteps} of {setupSteps.length} steps complete
                </Text>
              </BlockStack>
              {completedSteps === setupSteps.length && (
                <Badge tone="success">All done</Badge>
              )}
            </InlineStack>

            <BlockStack gap="200">
              {setupSteps.map((step) => (
                <Box
                  key={step.id}
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  padding="300"
                >
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="050">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {step.label}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {step.description}
                      </Text>
                    </BlockStack>
                    {!step.done && step.action && (
                      <Button onClick={step.action} size="slim">
                        {step.actionLabel}
                      </Button>
                    )}
                  </InlineStack>
                </Box>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Dashboard Stats */}
        <InlineGrid columns={3} gap="400">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">{stat.title}</Text>
                {isLoading ? (
                  <SkeletonDisplayText size="medium" />
                ) : (
                  <Text as="p" variant="heading2xl">{String(stat.value)}</Text>
                )}
              </BlockStack>
            </Card>
          ))}
        </InlineGrid>

        {/* Quick Actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Quick Actions</Text>
            <InlineStack gap="300" wrap>
              <Button onClick={() => navigate("/templates/new")}>New Template</Button>
              <Button onClick={() => navigate("/price-lists/new")}>New Price List</Button>
              <Button onClick={() => navigate("/shopify-products")}>Link Products</Button>
              <Button onClick={() => navigate("/settings")}>Settings</Button>
              {!hasTemplates && (
                <Button onClick={handleSeedDemo} loading={seeding} variant="tertiary">
                  Load Demo Data
                </Button>
              )}
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
