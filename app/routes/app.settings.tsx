import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Select,
  TextField,
  Button,
  Banner,
  Checkbox,
  Divider,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { REGIONS } from "~/types/calculator";
import type { RegionCode, UnitSystem } from "~/types/calculator";

interface RegionSettings {
  code: RegionCode;
  enabled: boolean;
  priceModifier: string;
  taxRate: string;
}

export default function SettingsPage() {
  const [defaultRegion, setDefaultRegion] = useState<RegionCode>("UK");
  const [defaultUnit, setDefaultUnit] = useState<UnitSystem>("metric");
  const [saved, setSaved] = useState(false);

  const [regionSettings, setRegionSettings] = useState<RegionSettings[]>(
    REGIONS.map((r) => ({
      code: r.code,
      enabled: true,
      priceModifier: r.priceModifier.toString(),
      taxRate: (r.taxRate * 100).toString(),
    }))
  );

  const regionOptions = REGIONS.map((r) => ({
    label: `${r.name} (${r.currencySymbol})`,
    value: r.code,
  }));

  const unitOptions = [
    { label: "Metric (cm)", value: "metric" },
    { label: "Imperial (inches)", value: "imperial" },
  ];

  const updateRegionSetting = useCallback(
    (code: RegionCode, field: keyof RegionSettings, value: string | boolean) => {
      setRegionSettings((prev) =>
        prev.map((r) => (r.code === code ? { ...r, [field]: value } : r))
      );
      setSaved(false);
    },
    []
  );

  const handleSave = useCallback(() => {
    // In production, this would POST to an API route and persist to DB
    console.log("Saving settings:", { defaultRegion, defaultUnit, regionSettings });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [defaultRegion, defaultUnit, regionSettings]);

  return (
    <Page
      title="Settings"
      subtitle="Configure regional pricing and measurement preferences"
      backAction={{ content: "Dashboard", url: "/" }}
    >
      <Layout>
        {saved && (
          <Layout.Section>
            <Banner title="Settings saved" tone="success" onDismiss={() => setSaved(false)} />
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Default Preferences</Text>
              <InlineStack gap="400">
                <div style={{ minWidth: 250 }}>
                  <Select
                    label="Default Region"
                    options={regionOptions}
                    value={defaultRegion}
                    onChange={(v) => { setDefaultRegion(v as RegionCode); setSaved(false); }}
                  />
                </div>
                <div style={{ minWidth: 200 }}>
                  <Select
                    label="Default Measurement Unit"
                    options={unitOptions}
                    value={defaultUnit}
                    onChange={(v) => { setDefaultUnit(v as UnitSystem); setSaved(false); }}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Regional Pricing</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Adjust the price modifier and tax rate for each region. The modifier is applied as a multiplier to the base calculated price.
              </Text>

              {regionSettings.map((rs) => {
                const regionInfo = REGIONS.find((r) => r.code === rs.code)!;
                return (
                  <div key={rs.code}>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h3" variant="headingSm">
                            {regionInfo.name}
                          </Text>
                          <Badge>{regionInfo.currency}</Badge>
                        </InlineStack>
                        <Checkbox
                          label="Enabled"
                          checked={rs.enabled}
                          onChange={(v) => updateRegionSetting(rs.code, "enabled", v)}
                        />
                      </InlineStack>

                      {rs.enabled && (
                        <InlineStack gap="400">
                          <div style={{ maxWidth: 180 }}>
                            <TextField
                              label="Price Modifier (×)"
                              type="number"
                              value={rs.priceModifier}
                              onChange={(v) => updateRegionSetting(rs.code, "priceModifier", v)}
                              autoComplete="off"
                              step={0.05}
                              min={0.5}
                              max={3.0}
                            />
                          </div>
                          <div style={{ maxWidth: 180 }}>
                            <TextField
                              label="Tax Rate (%)"
                              type="number"
                              value={rs.taxRate}
                              onChange={(v) => updateRegionSetting(rs.code, "taxRate", v)}
                              autoComplete="off"
                              step={0.5}
                              min={0}
                              max={50}
                            />
                          </div>
                        </InlineStack>
                      )}
                    </BlockStack>
                    <div style={{ marginTop: "1rem" }}>
                      <Divider />
                    </div>
                  </div>
                );
              })}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="end">
            <Button variant="primary" onClick={handleSave}>
              Save Settings
            </Button>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
