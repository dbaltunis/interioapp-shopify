import type {
  ProductType,
  RegionCode,
  CalculatorFormData,
  CalculationResult,
} from "~/types/calculator";
import { FABRICS, LININGS, HEADINGS, BASE_PRICES, REGIONS } from "~/types/calculator";

/**
 * Convert imperial inches to mm.
 */
export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

/**
 * Calculate the price for a made-to-measure product.
 * Width and height are expected in mm.
 */
export function calculatePrice(
  form: CalculatorFormData,
  region: RegionCode,
  unitSystem: "metric" | "imperial"
): CalculationResult {
  let widthMm = parseFloat(form.width) || 0;
  let heightMm = parseFloat(form.height) || 0;

  // Convert from inches if imperial
  if (unitSystem === "imperial") {
    widthMm = inchesToMm(widthMm);
    heightMm = inchesToMm(heightMm);
  }

  // Convert from cm to mm if metric (user enters cm)
  if (unitSystem === "metric") {
    widthMm = widthMm * 10;
    heightMm = heightMm * 10;
  }

  const areaSqM = (widthMm / 1000) * (heightMm / 1000);
  const priceConfig = BASE_PRICES[form.productType];
  const basePrice = priceConfig.base;
  const areaPrice = areaSqM * priceConfig.perSqM;

  const fabric = FABRICS.find((f) => f.value === form.fabric);
  const fabricSurcharge = (fabric?.surcharge ?? 0) * areaSqM;

  const lining = LININGS.find((l) => l.value === form.lining);
  const liningSurcharge = lining?.surcharge ?? 0;

  const headingOptions = HEADINGS[form.productType] ?? [];
  const heading = headingOptions.find((h) => h.value === form.headingStyle);
  const headingSurcharge = heading?.surcharge ?? 0;

  const subtotal = basePrice + areaPrice + fabricSurcharge + liningSurcharge + headingSurcharge;

  const regionConfig = REGIONS.find((r) => r.code === region);
  const regionModifier = regionConfig?.priceModifier ?? 1.0;
  const totalPrice = Math.round(subtotal * regionModifier * 100) / 100;

  return {
    basePrice,
    areaPrice: Math.round(areaPrice * 100) / 100,
    fabricSurcharge: Math.round(fabricSurcharge * 100) / 100,
    liningSurcharge,
    headingSurcharge,
    subtotal: Math.round(subtotal * 100) / 100,
    regionModifier,
    totalPrice,
    currency: regionConfig?.currency ?? "GBP",
    currencySymbol: regionConfig?.currencySymbol ?? "£",
  };
}
