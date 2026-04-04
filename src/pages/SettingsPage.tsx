import {
  Page,
  Card,
  BlockStack,
  InlineGrid,
  InlineStack,
  Text,
  Button,
  Badge,
  Icon,
  Box,
  Divider,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { showToast } from "@/lib/toast";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    features: ["1 product template", "1 pricing grid", "Basic calculator"],
    current: true,
  },
  {
    name: "Professional",
    price: "$29/month",
    features: [
      "Unlimited templates",
      "Unlimited grids",
      "Unlimited fabrics",
      "Quote management",
    ],
    current: false,
  },
  {
    name: "Enterprise",
    price: "$79/month",
    features: [
      "Everything in Professional",
      "Work orders",
      "Analytics",
      "Priority support",
    ],
    current: false,
  },
];

export default function SettingsPage() {
  const fetch = useAuthenticatedFetch();

  const handleSeedData = async () => {
    try {
      await fetch("/api/seed");
      showToast("Demo data seeded successfully");
    } catch {
      showToast("Failed to seed data", { isError: true });
    }
  };

  return (
    <Page title="Settings" subtitle="Manage your account and preferences">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Billing</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Choose the plan that fits your business
              </Text>
            </BlockStack>
            <InlineGrid columns={3} gap="400">
              {PLANS.map((plan) => (
                <Box
                  key={plan.name}
                  borderWidth="025"
                  borderColor={plan.current ? "border-success" : "border"}
                  borderRadius="200"
                  padding="400"
                >
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingMd">{plan.name}</Text>
                      {plan.current && <Badge tone="success">Current</Badge>}
                    </InlineStack>
                    <Text as="p" variant="heading2xl">{plan.price}</Text>
                    <Divider />
                    <BlockStack gap="200">
                      {plan.features.map((f) => (
                        <InlineStack key={f} gap="200" blockAlign="center">
                          <Icon source={CheckIcon} tone="success" />
                          <Text as="span" variant="bodyMd">{f}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                    {!plan.current && (
                      <Button fullWidth>Upgrade</Button>
                    )}
                  </BlockStack>
                </Box>
              ))}
            </InlineGrid>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Data Management</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Seed demo data or export your data
              </Text>
            </BlockStack>
            <InlineStack gap="300">
              <Button onClick={handleSeedData}>Seed Demo Data</Button>
              <Button>Export All Data</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
