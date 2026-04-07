import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  Button,
  Icon,
  Badge,
  Banner,
  Box,
  Divider,
  SkeletonDisplayText,
  ResourceList,
  ResourceItem,
  Collapsible,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  MinusCircleIcon,
} from "@shopify/polaris-icons";
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
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const hasTemplates = (templates?.length ?? 0) > 0;
  const hasQuotes = (quotes?.length ?? 0) > 0;
  const isLoading = loadingTemplates || loadingQuotes || loadingOrders;

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed");
      const json = await res.json();
      if (json.data?.seeded) {
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
      description: "Product templates define what your customers can configure \u2014 dimensions, options, and pricing for each product type (e.g. Roller Blind, Curtain, Venetian Blind).",
      done: hasTemplates,
      action: () => navigate("/templates/new"),
      actionLabel: "Create Template",
      guide: [
        "Go to Templates and click 'Add Template'",
        "Give it a name (e.g. 'Roller Blind') and choose a category",
        "Set min/max width and drop dimensions in mm",
        "Choose a pricing model: Grid (price lookup table), Per Square Metre, or Fixed",
        "Add options like Control Side, Motorisation, or Cassette type",
        "Each option can have a price adjustment (flat fee, multiplier, or per-sqm surcharge)",
      ],
    },
    {
      id: "pricing",
      label: "2. Set up pricing",
      description: "Create a pricing grid or set per-sqm rates so the calculator knows what to charge for each size.",
      done: false,
      action: () => navigate("/price-lists/new"),
      actionLabel: "Create Price List",
      guide: [
        "Go to Price Lists and click 'Add Price List'",
        "Link it to your product template",
        "For grid pricing: define width bands (e.g. 600, 900, 1200mm) and drop bands",
        "Fill in the price for each width/drop combination",
        "You can import prices from a CSV spreadsheet",
        "For per-sqm pricing: just set the rate per square metre",
      ],
    },
    {
      id: "products",
      label: "3. Link Shopify products",
      description: "Connect your Shopify products to templates so the calculator appears on the right product pages.",
      done: false,
      action: () => navigate("/shopify-products"),
      actionLabel: "Link Products",
      guide: [
        "Go to Products page \u2014 you'll see all your Shopify products listed",
        "Use the dropdown next to each product to select which template it should use",
        "This writes a metafield to the product so the calculator knows which config to load",
        "You can also auto-assign templates by product type (e.g. all 'Blinds' products use 'Roller Blind')",
      ],
    },
    {
      id: "widget",
      label: "4. Add the calculator to your theme",
      description: "Add the MeasureRight Calculator block to your product page template in the Shopify theme editor.",
      done: false,
      action: null,
      actionLabel: "",
      guide: [
        "Go to your Shopify Admin \u2192 Online Store \u2192 Themes \u2192 Customize",
        "Navigate to a product page template",
        "Click 'Add block' in the product information section",
        "Find 'MeasureRight Calculator' under Apps",
        "Enter the template code (e.g. 'roller-blind') that matches your template",
        "Toggle 'Hide default controls' to replace Shopify's default variant/quantity/ATC",
        "Save and preview your product page",
      ],
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
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="start">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon
                          source={step.done ? CheckCircleIcon : MinusCircleIcon}
                          tone={step.done ? "success" : "subdued"}
                        />
                        <BlockStack gap="050">
                          <Text
                            as="span"
                            variant="bodyMd"
                            fontWeight="semibold"
                            tone={step.done ? "subdued" : undefined}
                          >
                            {step.done ? <s>{step.label}</s> : step.label}
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {step.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Button
                          variant="plain"
                          onClick={() =>
                            setExpandedGuide(expandedGuide === step.id ? null : step.id)
                          }
                        >
                          {expandedGuide === step.id ? "Hide guide" : "How to"}
                        </Button>
                        {!step.done && step.action && (
                          <Button onClick={step.action} size="slim">
                            {step.actionLabel}
                          </Button>
                        )}
                      </InlineStack>
                    </InlineStack>
                    <Collapsible
                      open={expandedGuide === step.id}
                      id={`guide-${step.id}`}
                    >
                      <Box paddingInlineStart="800" paddingBlockStart="200">
                        <BlockStack gap="100">
                          {step.guide.map((line, i) => (
                            <Text key={i} as="p" variant="bodySm" tone="subdued">
                              {line}
                            </Text>
                          ))}
                        </BlockStack>
                      </Box>
                    </Collapsible>
                  </BlockStack>
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

        {/* Recent Quotes */}
        {hasQuotes && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Recent Quotes</Text>
              <ResourceList
                resourceName={{ singular: "quote", plural: "quotes" }}
                items={quotes?.slice(0, 5) || []}
                renderItem={(q: Quote) => (
                  <ResourceItem
                    id={q.id}
                    onClick={() => navigate(`/quotes/${q.id}`)}
                    accessibilityLabel={`View quote for ${q.customer_name}`}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">{q.customer_name}</Text>
                        <Text as="span" variant="bodySm" tone="subdued">{q.customer_email}</Text>
                      </BlockStack>
                      <BlockStack gap="050" inlineAlign="end">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">${q.total_inc_tax?.toFixed(2)}</Text>
                        <Text as="span" variant="bodySm" tone="subdued">{q.status}</Text>
                      </BlockStack>
                    </InlineStack>
                  </ResourceItem>
                )}
              />
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
