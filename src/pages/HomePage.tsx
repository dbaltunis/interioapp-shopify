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
  Icon,
  ProgressBar,
  SkeletonDisplayText,
} from "@shopify/polaris";
import {
  ProductIcon,
  CollectionIcon,
  LinkIcon,
  ThemeEditIcon,
  OrderIcon,
  SettingsIcon,
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
  const [dismissedWelcome, setDismissedWelcome] = useState(false);

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
    { title: "Templates", value: templates?.length ?? 0, action: () => navigate("/templates") },
    { title: "Quotes", value: quotes?.length ?? 0, action: () => navigate("/quotes") },
    { title: "Work Orders", value: orders?.length ?? 0, action: () => navigate("/orders") },
  ];

  const setupSteps = [
    {
      id: "templates",
      icon: ProductIcon,
      label: "Create a product template",
      description: "Define what customers can configure — dimensions, options, and pricing model.",
      done: hasTemplates,
      action: () => navigate("/templates/new"),
      actionLabel: "Create Template",
    },
    {
      id: "pricing",
      icon: CollectionIcon,
      label: "Set up pricing",
      description: "Add a pricing grid or per-sqm rate so the calculator can show prices.",
      done: false,
      action: () => navigate("/price-lists/new"),
      actionLabel: "Create Price List",
    },
    {
      id: "products",
      icon: LinkIcon,
      label: "Link to Shopify products",
      description: "Connect templates to your Shopify products so the calculator appears on the right pages.",
      done: false,
      action: () => navigate("/shopify-products"),
      actionLabel: "Link Products",
    },
    {
      id: "widget",
      icon: ThemeEditIcon,
      label: "Add calculator to your theme",
      description: "In the Shopify theme editor, add the MeasureRight Calculator block to your product page.",
      done: false,
      action: null,
      actionLabel: "",
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / setupSteps.length) * 100);

  return (
    <Page title="MeasureRight" subtitle="Made-to-measure pricing calculator for Shopify">
      <BlockStack gap="400">
        {/* Welcome banner for new users */}
        {!hasTemplates && !isLoading && !dismissedWelcome && (
          <Banner
            title="Welcome to MeasureRight!"
            tone="info"
            onDismiss={() => setDismissedWelcome(true)}
          >
            <BlockStack gap="300">
              <p>
                MeasureRight adds a made-to-measure pricing calculator to your product pages.
                Customers enter their dimensions and see an instant price.
              </p>
              <InlineStack gap="300">
                <Button onClick={handleSeedDemo} loading={seeding} variant="primary">
                  Try with demo products
                </Button>
                <Button onClick={() => navigate("/templates/new")} variant="plain">
                  Start from scratch
                </Button>
              </InlineStack>
            </BlockStack>
          </Banner>
        )}

        {/* Setup Guide */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Getting started</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {completedSteps === setupSteps.length
                    ? "You're all set!"
                    : `${completedSteps} of ${setupSteps.length} steps complete`}
                </Text>
              </BlockStack>
              {completedSteps === setupSteps.length && (
                <Badge tone="success">Complete</Badge>
              )}
            </InlineStack>

            <ProgressBar progress={progressPercent} size="small" tone="primary" />

            <BlockStack gap="300">
              {setupSteps.map((step, index) => (
                <Box
                  key={step.id}
                  borderWidth="025"
                  borderColor={step.done ? "border-success" : index === completedSteps ? "border-info" : "border"}
                  borderRadius="200"
                  padding="300"
                  background={step.done ? "bg-surface-success" : index === completedSteps ? "bg-surface-info" : "bg-surface"}
                >
                  <InlineStack gap="300" align="space-between" blockAlign="center" wrap={false}>
                    <InlineStack gap="300" blockAlign="start" wrap={false}>
                      <Box>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: step.done ? "var(--p-color-bg-fill-success)" : index === completedSteps ? "var(--p-color-bg-fill-info)" : "var(--p-color-bg-fill-secondary)",
                          color: step.done || index === completedSteps ? "#fff" : "var(--p-color-text-secondary)",
                          flexShrink: 0,
                        }}>
                          {step.done ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.78 5.97a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 5.97-5.97a.75.75 0 0 1 1.06 0Z" /></svg>
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{index + 1}</span>
                          )}
                        </div>
                      </Box>
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd" fontWeight="semibold" tone={step.done ? "success" : undefined}>
                          {step.label}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {step.description}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    {!step.done && step.action && (
                      <div style={{ flexShrink: 0 }}>
                        <Button
                          onClick={step.action}
                          size="slim"
                          variant={index === completedSteps ? "primary" : "plain"}
                        >
                          {step.actionLabel}
                        </Button>
                      </div>
                    )}
                    {step.done && (
                      <Badge tone="success">Done</Badge>
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
            <div key={stat.title} onClick={stat.action} style={{ cursor: "pointer" }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">{stat.title}</Text>
                  {isLoading ? (
                    <SkeletonDisplayText size="medium" />
                  ) : (
                    <Text as="p" variant="heading2xl">{String(stat.value)}</Text>
                  )}
                </BlockStack>
              </Card>
            </div>
          ))}
        </InlineGrid>

        {/* Quick Actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Quick Actions</Text>
            <InlineStack gap="300" wrap>
              <Button icon={ProductIcon} onClick={() => navigate("/templates/new")}>New Template</Button>
              <Button icon={CollectionIcon} onClick={() => navigate("/price-lists/new")}>New Price List</Button>
              <Button icon={LinkIcon} onClick={() => navigate("/shopify-products")}>Link Products</Button>
              <Button icon={OrderIcon} onClick={() => navigate("/quotes")}>View Quotes</Button>
              <Button icon={SettingsIcon} onClick={() => navigate("/settings")}>Settings</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
