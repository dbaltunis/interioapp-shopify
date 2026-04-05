import { useState, useCallback } from "react";
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
  Select,
  TextField,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "Free",
    features: ["1 product template", "1 pricing grid", "Basic calculator"],
  },
  {
    key: "professional",
    name: "Professional",
    price: "$29/month",
    features: [
      "Unlimited templates",
      "Unlimited grids",
      "Unlimited fabrics",
      "Quote management",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$79/month",
    features: [
      "Everything in Professional",
      "Work orders",
      "Analytics",
      "Priority support",
    ],
  },
];

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "EUR (\u20AC)", value: "EUR" },
  { label: "GBP (\u00A3)", value: "GBP" },
  { label: "AUD (A$)", value: "AUD" },
  { label: "NZD (NZ$)", value: "NZD" },
  { label: "CAD (C$)", value: "CAD" },
];

const MARKUP_MODE_OPTIONS = [
  { label: "Percentage (%)", value: "percentage" },
  { label: "Fixed amount", value: "fixed" },
];

export default function SettingsPage() {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch billing status
  const { data: billing } = useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      const res = await fetch("/api/billing");
      const json = await res.json();
      return json.data;
    },
  });

  const currentPlan = billing?.plan || "starter";

  // Settings form state
  const [currency, setCurrency] = useState("");
  const [markupMode, setMarkupMode] = useState("");
  const [markupValue, setMarkupValue] = useState("");

  // Sync form state when settings load
  const settingsCurrency = settings?.currency || "USD";
  const settingsMarkupMode = settings?.markup_mode || "percentage";
  const settingsMarkupValue = String(settings?.markup_value ?? "0");

  if (currency === "" && settings) {
    setCurrency(settingsCurrency);
    setMarkupMode(settingsMarkupMode);
    setMarkupValue(settingsMarkupValue);
  }

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          markup_mode: markupMode,
          markup_value: parseFloat(markupValue) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showToast("Settings saved");
    },
    onError: () => {
      showToast("Failed to save settings", { isError: true });
    },
  });

  // Upgrade plan
  const handleUpgrade = useCallback(async (planKey: string) => {
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const json = await res.json();
      if (json.data?.confirmation_url && json.data.confirmation_url !== "#") {
        // Redirect to Shopify charge approval page
        window.top
          ? (window.top.location.href = json.data.confirmation_url)
          : (window.location.href = json.data.confirmation_url);
      } else {
        showToast("Upgrade flow initiated", { isError: false });
      }
    } catch {
      showToast("Failed to start upgrade", { isError: true });
    }
  }, [fetch]);

  const handleSeedData = async () => {
    try {
      await fetch("/api/seed");
      showToast("Demo data seeded successfully");
    } catch {
      showToast("Failed to seed data", { isError: true });
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/settings/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `measureright-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Data exported successfully");
    } catch {
      showToast("Failed to export data", { isError: true });
    }
  };

  const hasSettingsChanges =
    currency !== settingsCurrency ||
    markupMode !== settingsMarkupMode ||
    markupValue !== settingsMarkupValue;

  return (
    <Page
      title="Settings"
      subtitle="Manage your account and preferences"
      primaryAction={
        hasSettingsChanges
          ? {
              content: "Save",
              onAction: () => saveSettings.mutate(),
              loading: saveSettings.isPending,
            }
          : undefined
      }
    >
      <BlockStack gap="400">
        {/* Pricing & Markup Settings */}
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Pricing Settings</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Configure currency and markup for your quotes
              </Text>
            </BlockStack>
            <InlineGrid columns={3} gap="400">
              <Select
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={currency || "USD"}
                onChange={setCurrency}
              />
              <Select
                label="Markup Mode"
                options={MARKUP_MODE_OPTIONS}
                value={markupMode || "percentage"}
                onChange={setMarkupMode}
              />
              <TextField
                label={markupMode === "percentage" ? "Markup (%)" : "Markup Amount"}
                type="number"
                value={markupValue}
                onChange={setMarkupValue}
                autoComplete="off"
                min={0}
              />
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Billing Plans */}
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Billing</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Choose the plan that fits your business
              </Text>
            </BlockStack>
            <InlineGrid columns={3} gap="400">
              {PLANS.map((plan) => {
                const isCurrent = plan.key === currentPlan;
                return (
                  <Box
                    key={plan.key}
                    borderWidth="025"
                    borderColor={isCurrent ? "border-success" : "border"}
                    borderRadius="200"
                    padding="400"
                  >
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingMd">{plan.name}</Text>
                        {isCurrent && <Badge tone="success">Current</Badge>}
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
                      {!isCurrent && plan.key !== "starter" && (
                        <Button fullWidth onClick={() => handleUpgrade(plan.key)}>
                          Upgrade
                        </Button>
                      )}
                      {!isCurrent && plan.key === "starter" && (
                        <Button fullWidth disabled>
                          Downgrade
                        </Button>
                      )}
                    </BlockStack>
                  </Box>
                );
              })}
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Data Management */}
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
              <Button onClick={handleExportData}>Export All Data</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
