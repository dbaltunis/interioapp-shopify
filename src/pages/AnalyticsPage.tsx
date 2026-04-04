import {
  Page,
  Card,
  BlockStack,
  InlineGrid,
  Text,
  SkeletonBodyText,
  SkeletonDisplayText,
  ProgressBar,
} from "@shopify/polaris";
import { useApiList } from "@/hooks/useApi";
import type { Quote, WorkOrder, ProductTemplate } from "@/lib/types";

export default function AnalyticsPage() {
  const { data: templates, isLoading: lt } = useApiList<ProductTemplate>("templates");
  const { data: quotes, isLoading: lq } = useApiList<Quote>("quotes");
  const { data: orders, isLoading: lo } = useApiList<WorkOrder>("work-orders");
  const isLoading = lt || lq || lo;

  const revenue =
    quotes
      ?.filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total_inc_tax || 0), 0) || 0;

  const quotesByStatus =
    quotes?.reduce(
      (acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const stats = [
    { title: "Total Templates", value: String(templates?.length ?? 0) },
    { title: "Total Quotes", value: String(quotes?.length ?? 0) },
    { title: "Total Orders", value: String(orders?.length ?? 0) },
    { title: "Revenue (Accepted)", value: `$${revenue.toFixed(2)}` },
  ];

  return (
    <Page title="Analytics" subtitle="Overview of your business metrics">
      <BlockStack gap="400">
        <InlineGrid columns={4} gap="400">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {stat.title}
                </Text>
                {isLoading ? (
                  <SkeletonDisplayText size="medium" />
                ) : (
                  <Text as="p" variant="heading2xl">
                    {stat.value}
                  </Text>
                )}
              </BlockStack>
            </Card>
          ))}
        </InlineGrid>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Quotes by Status
            </Text>
            {isLoading ? (
              <SkeletonBodyText lines={4} />
            ) : (
              <BlockStack gap="300">
                {["draft", "sent", "accepted", "rejected"].map((status) => {
                  const count = quotesByStatus[status] || 0;
                  const total = quotes?.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <BlockStack key={status} gap="100">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text as="span" variant="bodyMd" fontWeight="medium">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                        <Text as="span" variant="bodyMd" tone="subdued">
                          {count} ({pct}%)
                        </Text>
                      </div>
                      <ProgressBar progress={pct} size="small" />
                    </BlockStack>
                  );
                })}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
