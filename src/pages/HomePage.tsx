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
  SkeletonDisplayText,
  ResourceList,
  ResourceItem,
} from "@shopify/polaris";
import { CheckCircleIcon, MinusCircleIcon } from "@shopify/polaris-icons";
import { useApiList } from "@/hooks/useApi";
import type { ProductTemplate, Quote, WorkOrder } from "@/lib/types";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: templates, isLoading: loadingTemplates } = useApiList<ProductTemplate>("templates");
  const { data: quotes, isLoading: loadingQuotes } = useApiList<Quote>("quotes");
  const { data: orders, isLoading: loadingOrders } = useApiList<WorkOrder>("work-orders");

  const hasTemplates = (templates?.length ?? 0) > 0;
  const hasQuotes = (quotes?.length ?? 0) > 0;
  const isLoading = loadingTemplates || loadingQuotes || loadingOrders;

  const checklist = [
    { label: "Create your first product template", done: hasTemplates, path: "/templates/new" },
    { label: "Set up a pricing grid", done: false, path: "/price-lists/new" },
    { label: "Link a Shopify product", done: false, path: "/shopify-products" },
    { label: "Preview the calculator on your store", done: false, path: null as string | null },
  ];

  const stats = [
    { title: "Templates", value: templates?.length ?? 0 },
    { title: "Quotes", value: quotes?.length ?? 0 },
    { title: "Orders", value: orders?.length ?? 0 },
  ];

  return (
    <Page title="Dashboard" subtitle="Welcome to MeasureRight">
      <BlockStack gap="400">
        {!hasTemplates && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Getting Started</Text>
              <BlockStack gap="300">
                {checklist.map((item) => (
                  <InlineStack key={item.label} align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon
                        source={item.done ? CheckCircleIcon : MinusCircleIcon}
                        tone={item.done ? "success" : "subdued"}
                      />
                      <Text
                        as="span"
                        variant="bodyMd"
                        tone={item.done ? "subdued" : undefined}
                      >
                        {item.done ? <s>{item.label}</s> : item.label}
                      </Text>
                    </InlineStack>
                    {!item.done && item.path && (
                      <Button variant="plain" onClick={() => navigate(item.path!)}>
                        Start
                      </Button>
                    )}
                  </InlineStack>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        )}

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
