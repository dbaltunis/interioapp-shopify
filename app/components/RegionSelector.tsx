import { Select, InlineStack, Text } from "@shopify/polaris";
import { useCallback } from "react";
import { REGIONS } from "~/types/calculator";
import type { RegionCode, UnitSystem } from "~/types/calculator";

interface RegionSelectorProps {
  region: RegionCode;
  unitSystem: UnitSystem;
  onRegionChange: (region: RegionCode) => void;
  onUnitChange: (unit: UnitSystem) => void;
}

export function RegionSelector({
  region,
  unitSystem,
  onRegionChange,
  onUnitChange,
}: RegionSelectorProps) {
  const regionOptions = REGIONS.map((r) => ({
    label: `${r.name} (${r.currencySymbol} ${r.currency})`,
    value: r.code,
  }));

  const unitOptions = [
    { label: "Metric (cm)", value: "metric" },
    { label: "Imperial (inches)", value: "imperial" },
  ];

  const handleRegionChange = useCallback(
    (value: string) => {
      const newRegion = value as RegionCode;
      onRegionChange(newRegion);
      // Auto-switch unit system to region default
      const regionConfig = REGIONS.find((r) => r.code === newRegion);
      if (regionConfig) {
        onUnitChange(regionConfig.defaultUnit);
      }
    },
    [onRegionChange, onUnitChange]
  );

  const handleUnitChange = useCallback(
    (value: string) => onUnitChange(value as UnitSystem),
    [onUnitChange]
  );

  return (
    <InlineStack gap="400" align="start" blockAlign="end">
      <div style={{ minWidth: 250 }}>
        <Select
          label="Region"
          options={regionOptions}
          value={region}
          onChange={handleRegionChange}
        />
      </div>
      <div style={{ minWidth: 180 }}>
        <Select
          label="Measurement Units"
          options={unitOptions}
          value={unitSystem}
          onChange={handleUnitChange}
        />
      </div>
      <div style={{ paddingBottom: "0.25rem" }}>
        <Text as="span" variant="bodySm" tone="subdued">
          Prices shown in {REGIONS.find((r) => r.code === region)?.currency}
        </Text>
      </div>
    </InlineStack>
  );
}
