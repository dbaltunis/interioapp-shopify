import { useState, useCallback, useMemo } from "react";
import {
  FormLayout,
  Select,
  TextField,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Divider,
  Box,
} from "@shopify/polaris";
import type {
  ProductType,
  RegionCode,
  UnitSystem,
  CalculatorFormData,
  CalculationResult,
} from "~/types/calculator";
import { FABRICS, LININGS, HEADINGS } from "~/types/calculator";
import { calculatePrice } from "~/utils/pricing";

interface CalculatorProps {
  region: RegionCode;
  unitSystem: UnitSystem;
}

export function Calculator({ region, unitSystem }: CalculatorProps) {
  const [formData, setFormData] = useState<CalculatorFormData>({
    productType: "curtains",
    width: "",
    height: "",
    fabric: "cotton-standard",
    lining: "none",
    headingStyle: "pencil-pleat",
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const unitLabel = unitSystem === "metric" ? "cm" : "inches";

  const productTypeOptions = [
    { label: "Blinds", value: "blinds" },
    { label: "Curtains", value: "curtains" },
    { label: "Shutters", value: "shutters" },
  ];

  const fabricOptions = FABRICS.map((f) => ({
    label: f.surcharge > 0 ? `${f.label} (+${f.surcharge}/m²)` : f.label,
    value: f.value,
  }));

  const liningOptions = LININGS.map((l) => ({
    label: l.surcharge > 0 ? `${l.label} (+${l.surcharge})` : l.label,
    value: l.value,
  }));

  const headingOptions = useMemo(() => {
    const options = HEADINGS[formData.productType] ?? [];
    return options.map((h) => ({
      label: h.surcharge > 0 ? `${h.label} (+${h.surcharge})` : h.surcharge < 0 ? `${h.label} (${h.surcharge})` : h.label,
      value: h.value,
    }));
  }, [formData.productType]);

  const updateField = useCallback(
    <K extends keyof CalculatorFormData>(field: K) =>
      (value: CalculatorFormData[K]) => {
        setFormData((prev) => {
          const next = { ...prev, [field]: value };
          // Reset heading when product type changes
          if (field === "productType") {
            const newType = value as ProductType;
            const availableHeadings = HEADINGS[newType];
            next.headingStyle = availableHeadings?.[0]?.value ?? "";
          }
          return next;
        });
        setErrors((prev) => ({ ...prev, [field]: "" }));
      },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const width = parseFloat(formData.width);
    const height = parseFloat(formData.height);

    if (!formData.width || isNaN(width) || width <= 0) {
      newErrors.width = "Enter a valid width";
    }
    if (!formData.height || isNaN(height) || height <= 0) {
      newErrors.height = "Enter a valid height / drop";
    }

    // Sanity limits (in cm for metric, inches for imperial)
    const maxDim = unitSystem === "metric" ? 600 : 236; // ~6m or ~236in
    if (width > maxDim) newErrors.width = `Maximum ${maxDim} ${unitLabel}`;
    if (height > maxDim) newErrors.height = `Maximum ${maxDim} ${unitLabel}`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, unitSystem, unitLabel]);

  const handleCalculate = useCallback(() => {
    if (!validate()) return;
    const calcResult = calculatePrice(formData, region, unitSystem);
    setResult(calcResult);
  }, [formData, region, unitSystem, validate]);

  const handleReset = useCallback(() => {
    setFormData({
      productType: "curtains",
      width: "",
      height: "",
      fabric: "cotton-standard",
      lining: "none",
      headingStyle: "pencil-pleat",
    });
    setResult(null);
    setErrors({});
  }, []);

  return (
    <BlockStack gap="400">
      <FormLayout>
        <Select
          label="Product Type"
          options={productTypeOptions}
          value={formData.productType}
          onChange={updateField("productType")}
        />

        <FormLayout.Group>
          <TextField
            label={`Width (${unitLabel})`}
            type="number"
            value={formData.width}
            onChange={updateField("width")}
            error={errors.width}
            autoComplete="off"
            min={0}
            placeholder={unitSystem === "metric" ? "e.g. 120" : "e.g. 48"}
          />
          <TextField
            label={`Height / Drop (${unitLabel})`}
            type="number"
            value={formData.height}
            onChange={updateField("height")}
            error={errors.height}
            autoComplete="off"
            min={0}
            placeholder={unitSystem === "metric" ? "e.g. 210" : "e.g. 84"}
          />
        </FormLayout.Group>

        <Select
          label="Fabric"
          options={fabricOptions}
          value={formData.fabric}
          onChange={updateField("fabric")}
        />

        {formData.productType !== "shutters" && (
          <Select
            label="Lining"
            options={liningOptions}
            value={formData.lining}
            onChange={updateField("lining")}
          />
        )}

        <Select
          label="Heading / Style"
          options={headingOptions}
          value={formData.headingStyle}
          onChange={updateField("headingStyle")}
        />
      </FormLayout>

      <InlineStack gap="300">
        <Button variant="primary" onClick={handleCalculate}>
          Calculate Price
        </Button>
        <Button onClick={handleReset}>Reset</Button>
      </InlineStack>

      {result && (
        <>
          <Divider />
          <Banner title="Price Breakdown" tone="success">
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="span">Base price:</Text>
                <Text as="span">{result.currencySymbol}{result.basePrice.toFixed(2)}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span">Area cost:</Text>
                <Text as="span">{result.currencySymbol}{result.areaPrice.toFixed(2)}</Text>
              </InlineStack>
              {result.fabricSurcharge > 0 && (
                <InlineStack align="space-between">
                  <Text as="span">Fabric surcharge:</Text>
                  <Text as="span">{result.currencySymbol}{result.fabricSurcharge.toFixed(2)}</Text>
                </InlineStack>
              )}
              {result.liningSurcharge > 0 && (
                <InlineStack align="space-between">
                  <Text as="span">Lining:</Text>
                  <Text as="span">{result.currencySymbol}{result.liningSurcharge.toFixed(2)}</Text>
                </InlineStack>
              )}
              {result.headingSurcharge !== 0 && (
                <InlineStack align="space-between">
                  <Text as="span">Heading style:</Text>
                  <Text as="span">{result.currencySymbol}{result.headingSurcharge.toFixed(2)}</Text>
                </InlineStack>
              )}
              <Divider />
              <InlineStack align="space-between">
                <Text as="span" fontWeight="bold">Subtotal:</Text>
                <Text as="span" fontWeight="bold">{result.currencySymbol}{result.subtotal.toFixed(2)}</Text>
              </InlineStack>
              {result.regionModifier !== 1.0 && (
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Regional adjustment (×{result.regionModifier}):</Text>
                  <Text as="span" tone="subdued">applied</Text>
                </InlineStack>
              )}
              <Box paddingBlockStart="200">
                <InlineStack align="space-between">
                  <Text as="span" variant="headingMd" fontWeight="bold">Total:</Text>
                  <Text as="span" variant="headingMd" fontWeight="bold">
                    {result.currencySymbol}{result.totalPrice.toFixed(2)} {result.currency}
                  </Text>
                </InlineStack>
              </Box>
            </BlockStack>
          </Banner>
        </>
      )}
    </BlockStack>
  );
}
