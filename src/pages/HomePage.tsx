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
  SkeletonDisplayText,
} from "@shopify/polaris";
import { CheckSmallIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { useApiList } from "@/hooks/useApi";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { showToast } from "@/lib/toast";
import type { ProductTemplate, Quote, WorkOrder } from "@/lib/types";

export default function HomePage() {
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch();
  const {
    data: templates,
    isLoading: loadingTemplates,
    refetch: refetchTemplates,
  } = useApiList<ProductTemplate>("templates");
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
    { title: "Templates", value: templates?.length ?? 0, action: () => navigate("/templates") },
    { title: "Quotes", value: quotes?.length ?? 0, action: () => navigate("/quotes") },
    { title: "Work Orders", value: orders?.length ?? 0, action: () => navigate("/orders") },
  ];

  const setupSteps = [
    {
      id: "templates",
      label: "Create a product template",
      description: "Define dimensions, options, and pricing model for a product type.",
      done: hasTemplates,
      action: () => navigate("/templates/new"),
      actionLabel: "Create template",
    },
    {
      id: "pricing",
      label: "Set up pricing",
      description: "Add a pricing grid or per-sqm rate so the calculator can show prices.",
      done: false,
      action: () => navigate("/price-lists/new"),
      actionLabel: "Create price list",
    },
    {
      id: "products",
      label: "Link to Shopify products",
      description: "Connect templates to products so the calculator appears on the right pages.",
      done: false,
      action: () => navigate("/shopify-products"),
      actionLabel: "Link products",
    },
    {
      id: "widget",
      label: "Add calculator to your theme",
      description: "In the theme editor, add the MeasureRight Calculator block to your product page.",
      done: false,
      action: null as (() => void) | null,
      actionLabel: "",
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <Page title="MeasureRight" subtitle="Made-to-measure pricing calculator">
      <BlockStack gap="500">
        {/* Welcome banner */}
        {!hasTemplates && !isLoading && (
          <Banner
            title="Welcome to MeasureRight"
            tone="info"
            action={{ content: "Load demo products", onAction: handleSeedDemo, loading: seeding }}
            secondaryAction={{ content: "Start from scratch", onAction: () => navigate("/templates/new") }}
          >
            <p>
              Get started quickly with demo products (Roller Blind, Venetian Blind, Curtains)
              or create your own from scratch.
            </p>
          </Banner>
        )}

        {/* Stats */}
        <InlineGrid columns={3} gap="400">
          {stats.map((stat) => (
            <div key={stat.title} onClick={stat.action} style={{ cursor: "pointer" }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">{stat.title}</Text>
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

        {/* Setup checklist */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Setup guide</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {completedSteps} of {setupSteps.length} complete
              </Text>
            </InlineStack>

            <BlockStack gap="0">
              {setupSteps.map((step, i) => {
                const isNext = !step.done && i === completedSteps;
                return (
                  <Box
                    key={step.id}
                    padding="300"
                    borderBlockEndWidth={i < setupSteps.length - 1 ? "025" : undefined}
                    borderColor="border"
                  >
                    <InlineStack gap="300" align="space-between" blockAlign="center" wrap={false}>
                      <InlineStack gap="300" blockAlign="start" wrap={false}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 2,
                            ...(step.done
                              ? { background: "var(--p-color-bg-fill-success)", color: "#fff" }
                              : isNext
                                ? { border: "2px solid var(--p-color-border-emphasis)", color: "var(--p-color-text-emphasis)" }
                                : { border: "2px solid var(--p-color-border-secondary)", color: "var(--p-color-text-secondary)" }),
                          }}
                        >
                          {step.done ? (
                            <Icon source={CheckSmallIcon} />
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                          )}
                        </div>
                        <BlockStack gap="050">
                          <Text as="span" variant="bodyMd" fontWeight={isNext ? "bold" : "medium"}>
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
                            variant={isNext ? "primary" : "plain"}
                          >
                            {step.actionLabel}
                          </Button>
                        </div>
                      )}
                      {step.done && <Badge tone="success">Done</Badge>}
                    </InlineStack>
                  </Box>
                );
              })}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Quick actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Quick actions</Text>
            <InlineStack gap="200" wrap>
              <Button onClick={() => navigate("/templates/new")}>New template</Button>
              <Button onClick={() => navigate("/price-lists/new")}>New price list</Button>
              <Button onClick={() => navigate("/shopify-products")}>Link products</Button>
              <Button onClick={() => navigate("/settings")} variant="plain">Settings</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
