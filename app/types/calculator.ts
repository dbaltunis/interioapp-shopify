export type ProductType = "blinds" | "curtains" | "shutters";
export type UnitSystem = "metric" | "imperial";
export type RegionCode = "US" | "UK" | "AU" | "NZ" | "CA" | "EU";

export interface CalculatorFormData {
  productType: ProductType;
  width: string;
  height: string;
  fabric: string;
  lining: string;
  headingStyle: string;
}

export interface CalculationResult {
  basePrice: number;
  areaPrice: number;
  fabricSurcharge: number;
  liningSurcharge: number;
  headingSurcharge: number;
  subtotal: number;
  regionModifier: number;
  totalPrice: number;
  currency: string;
  currencySymbol: string;
}

export interface RegionConfig {
  code: RegionCode;
  name: string;
  currency: string;
  currencySymbol: string;
  defaultUnit: UnitSystem;
  taxRate: number;
  priceModifier: number;
}

export const REGIONS: RegionConfig[] = [
  { code: "UK", name: "United Kingdom", currency: "GBP", currencySymbol: "£", defaultUnit: "metric", taxRate: 0.2, priceModifier: 1.0 },
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", defaultUnit: "imperial", taxRate: 0, priceModifier: 1.25 },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$", defaultUnit: "metric", taxRate: 0.1, priceModifier: 1.45 },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "NZ$", defaultUnit: "metric", taxRate: 0.15, priceModifier: 1.55 },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$", defaultUnit: "imperial", taxRate: 0.13, priceModifier: 1.30 },
  { code: "EU", name: "European Union", currency: "EUR", currencySymbol: "€", defaultUnit: "metric", taxRate: 0.21, priceModifier: 1.15 },
];

export const FABRICS = [
  { value: "cotton-standard", label: "Cotton Standard", surcharge: 0 },
  { value: "cotton-premium", label: "Cotton Premium", surcharge: 15 },
  { value: "linen-natural", label: "Linen Natural", surcharge: 25 },
  { value: "linen-belgian", label: "Belgian Linen", surcharge: 45 },
  { value: "silk-blend", label: "Silk Blend", surcharge: 60 },
  { value: "velvet", label: "Velvet", surcharge: 40 },
  { value: "sheer-voile", label: "Sheer Voile", surcharge: 10 },
  { value: "blackout", label: "Blackout", surcharge: 20 },
  { value: "sunscreen-5", label: "Sunscreen 5%", surcharge: 30 },
  { value: "wood-basswood", label: "Basswood (Shutters)", surcharge: 50 },
  { value: "wood-cedar", label: "Cedar (Shutters)", surcharge: 70 },
  { value: "pvc-composite", label: "PVC Composite", surcharge: 0 },
];

export const LININGS = [
  { value: "none", label: "No Lining", surcharge: 0 },
  { value: "standard", label: "Standard Lining", surcharge: 10 },
  { value: "thermal", label: "Thermal Lining", surcharge: 20 },
  { value: "blackout", label: "Blackout Lining", surcharge: 30 },
  { value: "interlining", label: "Interlining", surcharge: 40 },
];

export const HEADINGS: Record<ProductType, { value: string; label: string; surcharge: number }[]> = {
  curtains: [
    { value: "pencil-pleat", label: "Pencil Pleat", surcharge: 0 },
    { value: "pinch-pleat", label: "Pinch Pleat", surcharge: 20 },
    { value: "wave", label: "Wave / S-Fold", surcharge: 25 },
    { value: "eyelet", label: "Eyelet", surcharge: 15 },
    { value: "goblet", label: "Goblet Pleat", surcharge: 30 },
    { value: "tab-top", label: "Tab Top", surcharge: 5 },
  ],
  blinds: [
    { value: "roller", label: "Roller", surcharge: 0 },
    { value: "roman", label: "Roman", surcharge: 15 },
    { value: "venetian", label: "Venetian", surcharge: 10 },
    { value: "vertical", label: "Vertical", surcharge: 5 },
    { value: "pleated", label: "Pleated", surcharge: 12 },
  ],
  shutters: [
    { value: "full-height", label: "Full Height", surcharge: 0 },
    { value: "tier-on-tier", label: "Tier on Tier", surcharge: 40 },
    { value: "cafe-style", label: "Café Style", surcharge: -10 },
    { value: "solid-panel", label: "Solid Panel", surcharge: 20 },
  ],
};

export const BASE_PRICES: Record<ProductType, { base: number; perSqM: number }> = {
  blinds: { base: 45, perSqM: 35 },
  curtains: { base: 65, perSqM: 55 },
  shutters: { base: 120, perSqM: 95 },
};
