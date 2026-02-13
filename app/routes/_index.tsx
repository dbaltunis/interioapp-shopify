import { Page, Layout, Card, Text, BlockStack, Button, InlineStack, Icon, Badge } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Page title="InterioApp Calculator" subtitle="Made-to-measure pricing for blinds, curtains, and shutters">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Welcome to InterioApp
              </Text>
              <Text as="p" variant="bodyMd">
                InterioApp provides instant, accurate pricing for made-to-measure window furnishings.
                Configure your products, set regional pricing, and give your customers a seamless quoting experience.
              </Text>
              <InlineStack gap="300">
                <Button variant="primary" onClick={() => navigate("/app/calculator")}>
                  Open Calculator
                </Button>
                <Button onClick={() => navigate("/app/settings")}>
                  Settings
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingSm">Blinds</Text>
                  <Badge tone="success">Active</Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Roller, Roman, Venetian, Vertical, and Pleated blinds with full fabric and lining options.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingSm">Curtains</Text>
                  <Badge tone="success">Active</Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Pencil Pleat, Pinch Pleat, Wave, Eyelet, Goblet, and Tab Top heading styles.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingSm">Shutters</Text>
                  <Badge tone="success">Active</Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Full Height, Tier on Tier, Café Style, and Solid Panel in Basswood, Cedar, or PVC.
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Supported Regions</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                🇬🇧 UK · 🇺🇸 US · 🇦🇺 AU · 🇳🇿 NZ · 🇨🇦 CA · 🇪🇺 EU
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Automatic currency conversion and regional price adjustments. Metric and imperial units supported.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
