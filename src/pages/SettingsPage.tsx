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
    price: "$99/month",
    trial: "7-day free trial",
    features: [
      "Up to 5 product templates",
      "Grid & area pricing",
      "Basic calculator widget",
      "Email support",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    price: "$119/month",
    trial: "7-day free trial",
    recommended: true,
    features: [
      "Unlimited templates",
      "All pricing models",
      "Quote management",
      "Widget customisation",
      "Priority support",
    ],
  },
  {
    key: "business",
    name: "Business",
    price: "$199/month",
    trial: "7-day free trial",
    features: [
      "Everything in Professional",
      "Work orders & analytics",
      "Multi-vendor support",
      "Data export",
      "Dedicated support",
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

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: billing } = useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      const res = await fetch("/api/billing");
      const json = await res.json();
      return json.data;
    },
  });

  const currentPlan = billing?.plan || "starter";

  const [currency, setCurrency] = useState("");
  const [markupMode, setMarkupMode] = useState("");
  const [markupValue, setMarkupValue] = useState("");

  const settingsCurrency = settings?.currency || "USD";
  const settingsMarkupMode = settings?.markup_mode || "percentage";
  const settingsMarkupValue = String(settings?.markup_value ?? "0");

  if (currency === "" && settings) {
    setCurrency(settingsCurrency);
    setMarkupMode(settingsMarkupMode);
    setMarkupValue(settingsMarkupValue);
  }

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

  const handleUpgrade = useCallback(async (planKey: string) => {
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const json = await res.json();
      if (json.data?.confirmation_url && json.data.confirmation_url !== "#") {
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

  const [widgetAccentColor, setWidgetAccentColor] = useState(settings?.widget_accent_color || "#2563eb");
  const [widgetButtonStyle, setWidgetButtonStyle] = useState(settings?.widget_button_style || "rounded");
  const [widgetShowBreakdown, setWidgetShowBreakdown] = useState(settings?.widget_show_breakdown ?? true);
  const [widgetShowFromPrice, setWidgetShowFromPrice] = useState(settings?.widget_show_from_price ?? true);
  const [widgetHideDefaults, setWidgetHideDefaults] = useState(settings?.widget_hide_defaults ?? true);

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
        {/* Pricing */}
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Pricing Settings</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Configure currency and markup for your quotes
              </Text>
            </BlockStack>
            <InlineGrid columns={3} gap="400">
              <Select label="Currency" options={CURRENCY_OPTIONS} value={currency || "USD"} onChange={setCurrency} />
              <Select label="Markup Mode" options={MARKUP_MODE_OPTIONS} value={markupMode || "percentage"} onChange={setMarkupMode} />
              <TextField label={markupMode === "percentage" ? "Markup (%)" : "Markup Amount"} type="number" value={markupValue} onChange={setMarkupValue} autoComplete="off" min={0} />
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Widget */}
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Widget Customisation</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                These settings are configured per-block in your theme editor.
              </Text>
            </BlockStack>
            <InlineGrid columns={2} gap="400">
              <TextField
                label="Accent Colour"
                value={widgetAccentColor}
                onChange={setWidgetAccentColor}
                autoComplete="off"
                helpText="Hex colour code (e.g. #2563eb)"
                prefix={
                  <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: widgetAccentColor, border: "1px solid #ddd" }} />
                }
              />
              <Select
                label="Button Style"
                options={[
                  { label: "Rounded", value: "rounded" },
                  { label: "Square", value: "square" },
                  { label: "Pill", value: "pill" },
                ]}
                value={widgetButtonStyle}
                onChange={setWidgetButtonStyle}
              />
            </InlineGrid>
            <InlineGrid columns={3} gap="400">
              <Select
                label="Show Price Breakdown"
                options={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
                value={String(widgetShowBreakdown)}
                onChange={(val) => setWidgetShowBreakdown(val === "true")}
              />
              <Select
                label="Show 'From' Price"
                options={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
                value={String(widgetShowFromPrice)}
                onChange={(val) => setWidgetShowFromPrice(val === "true")}
              />
              <Select
                label="Hide Default Controls"
                options={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
                value={String(widgetHideDefaults)}
                onChange={(val) => setWidgetHideDefaults(val === "true")}
              />
            </InlineGrid>
            <Text as="p" variant="bodySm" tone="subdued">
              Go to Online Store &rarr; Themes &rarr; Customize to apply these settings on the MeasureRight Calculator block.
            </Text>
          </BlockStack>
        </Card>

        {/* Billing */}
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Billing</Text>
              <Text as="p" variant="bodySm" tone="subdued">
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
                      <Text as="p" variant="bodySm" tone="subdued">{plan.trial}</Text>
                      <Divider />
                      <BlockStack gap="200">
                        {plan.features.map((f) => (
                          <InlineStack key={f} gap="200" blockAlign="center">
                            <Icon source={CheckIcon} tone="success" />
                            <Text as="span" variant="bodyMd">{f}</Text>
                          </InlineStack>
                        ))}
                      </BlockStack>
                      {!isCurrent && (
                        <Button fullWidth onClick={() => handleUpgrade(plan.key)}>
                          {PLANS.indexOf(plan) > PLANS.findIndex(p => p.key === currentPlan) ? "Upgrade" : "Switch Plan"}
                        </Button>
                      )}
                    </BlockStack>
                  </Box>
                );
              })}
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Data */}
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Data Management</Text>
              <Text as="p" variant="bodySm" tone="subdued">
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
