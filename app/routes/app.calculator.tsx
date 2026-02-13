import { useState } from "react";
import { Page, Layout, Card, BlockStack, Text } from "@shopify/polaris";
import { Calculator } from "~/components/Calculator";
import { RegionSelector } from "~/components/RegionSelector";
import type { RegionCode, UnitSystem } from "~/types/calculator";

export default function CalculatorPage() {
  const [region, setRegion] = useState<RegionCode>("UK");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  return (
    <Page
      title="Made-to-Measure Calculator"
      subtitle="Calculate pricing for blinds, curtains, and shutters"
      backAction={{ content: "Dashboard", url: "/" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Region & Units</Text>
              <RegionSelector
                region={region}
                unitSystem={unitSystem}
                onRegionChange={setRegion}
                onUnitChange={setUnitSystem}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Product Configuration</Text>
              <Calculator region={region} unitSystem={unitSystem} />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
