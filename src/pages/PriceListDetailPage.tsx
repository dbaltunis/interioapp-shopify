import { useEffect, useState, useCallback, memo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  FormLayout,
  TextField,
  Select,
  Button,
  ButtonGroup,
  SkeletonPage,
  SkeletonBodyText,
} from "@shopify/polaris";
import { PlusCircleIcon, DeleteIcon, ExportIcon, ImportIcon } from "@shopify/polaris-icons";
import { useApiGet, useApiCreate, useApiUpdate, useApiList } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
import type { PricingGrid, ProductTemplate, Fabric } from "@/lib/types";
import Papa from "papaparse";

function toMatrix(prices: number[], widthCount: number, dropCount: number): number[][] {
  const matrix: number[][] = [];
  for (let d = 0; d < dropCount; d++) {
    const row: number[] = [];
    for (let w = 0; w < widthCount; w++) {
      row.push(prices[d * widthCount + w] ?? 0);
    }
    matrix.push(row);
  }
  return matrix;
}

function toFlat(matrix: number[][]): number[] {
  return matrix.flat();
}

const cellStyle: React.CSSProperties = {
  width: "80px",
  height: "32px",
  padding: "0 4px",
  textAlign: "right",
  fontSize: "var(--p-font-size-300)",
  border: "var(--p-border-width-025) solid var(--p-color-border)",
  borderRadius: "var(--p-border-radius-200)",
  fontFamily: "var(--p-font-family-mono)",
  outline: "none",
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "center",
  fontWeight: 600,
  background: "var(--p-color-bg-surface-secondary)",
};

const GridCell = memo(function GridCell({
  value,
  onChange,
  onKeyDown,
}: {
  value: number;
  onChange: (val: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <input
      type="number"
      style={cellStyle}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      onKeyDown={onKeyDown}
    />
  );
});

export default function PriceListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading } = useApiGet<PricingGrid>("grids", isNew ? undefined : id);
  const { data: templates } = useApiList<ProductTemplate>("templates");
  const { data: fabrics } = useApiList<Fabric>("fabrics");
  const createMutation = useApiCreate<PricingGrid>("grids");
  const updateMutation = useApiUpdate<PricingGrid>("grids");

  const [templateId, setTemplateId] = useState("");
  const [fabricId, setFabricId] = useState("");
  const [widthBands, setWidthBands] = useState<number[]>([600, 900, 1200, 1500, 1800]);
  const [dropBands, setDropBands] = useState<number[]>([1000, 1500, 2000, 2500]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [rollWidth, setRollWidth] = useState<number | null>(null);
  const [priceSqm, setPriceSqm] = useState<number | null>(null);
  const [priceLm, setPriceLm] = useState<number | null>(null);
  const [patternRepeat, setPatternRepeat] = useState<number | null>(null);

  const initMatrix = useCallback(() => {
    setMatrix(dropBands.map(() => widthBands.map(() => 0)));
  }, [widthBands, dropBands]);

  useEffect(() => {
    if (existing) {
      setTemplateId(existing.product_template_id);
      setFabricId(existing.fabric_id || "");
      setWidthBands(existing.width_bands || []);
      setDropBands(existing.drop_bands || []);
      setRollWidth(existing.roll_width);
      setPriceSqm(existing.price_per_sqm);
      setPriceLm(existing.price_per_linear_metre);
      setPatternRepeat(existing.pattern_repeat);
      if (existing.prices?.length && existing.width_bands?.length && existing.drop_bands?.length) {
        setMatrix(toMatrix(existing.prices, existing.width_bands.length, existing.drop_bands.length));
      }
    } else if (isNew) {
      initMatrix();
    }
  }, [existing, isNew, initMatrix]);

  const updateCell = (dropIdx: number, widthIdx: number, value: number) => {
    setMatrix((prev) => {
      const next = prev.map((row) => [...row]);
      next[dropIdx][widthIdx] = value;
      return next;
    });
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, dropIdx: number, widthIdx: number) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const nextW = widthIdx + 1;
      const nextD = dropIdx + 1;
      let nextCell: HTMLInputElement | null = null;
      if (nextW < widthBands.length) {
        nextCell = target.closest("tr")?.querySelectorAll("input")[nextW] as HTMLInputElement;
      } else if (nextD < dropBands.length) {
        nextCell = target.closest("tbody")?.querySelectorAll("tr")[nextD]?.querySelector("input") as HTMLInputElement;
      }
      nextCell?.focus();
      nextCell?.select();
    }
  };

  const addWidthBand = () => {
    const lastBand = widthBands[widthBands.length - 1] || 0;
    setWidthBands([...widthBands, lastBand + 300]);
    setMatrix((prev) => prev.map((row) => [...row, 0]));
  };

  const addDropBand = () => {
    const lastBand = dropBands[dropBands.length - 1] || 0;
    setDropBands([...dropBands, lastBand + 500]);
    setMatrix((prev) => [...prev, widthBands.map(() => 0)]);
  };

  const removeWidthBand = (idx: number) => {
    if (widthBands.length <= 1) return;
    setWidthBands((prev) => prev.filter((_, i) => i !== idx));
    setMatrix((prev) => prev.map((row) => row.filter((_, i) => i !== idx)));
  };

  const removeDropBand = (idx: number) => {
    if (dropBands.length <= 1) return;
    setDropBands((prev) => prev.filter((_, i) => i !== idx));
    setMatrix((prev) => prev.filter((_, i) => i !== idx));
  };

  const exportCsv = () => {
    const header = ["Drop \\ Width", ...widthBands.map(String)];
    const rows = dropBands.map((d, i) => [String(d), ...matrix[i].map(String)]);
    const csv = Papa.unparse([header, ...rows]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pricing-grid.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (result) => {
        try {
          const rows = result.data as string[][];
          if (rows.length < 2) throw new Error("Not enough rows");
          const headerRow = rows[0];
          const newWidths = headerRow.slice(1).map(Number).filter((n) => !isNaN(n));
          const newDrops: number[] = [];
          const newMatrix: number[][] = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0]) continue;
            const dropVal = Number(row[0]);
            if (isNaN(dropVal)) continue;
            newDrops.push(dropVal);
            newMatrix.push(row.slice(1).map((v) => Number(v) || 0));
          }
          setWidthBands(newWidths);
          setDropBands(newDrops);
          setMatrix(newMatrix);
          showToast("CSV imported successfully");
        } catch {
          showToast("Invalid CSV format", { isError: true });
        }
      },
      error: () => showToast("Failed to parse CSV", { isError: true }),
    });
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!templateId) {
      showToast("Please select a template", { isError: true });
      return;
    }
    const data = {
      product_template_id: templateId,
      fabric_id: fabricId || null,
      width_bands: widthBands,
      drop_bands: dropBands,
      prices: toFlat(matrix),
      roll_width: rollWidth,
      price_per_sqm: priceSqm,
      price_per_linear_metre: priceLm,
      pattern_repeat: patternRepeat,
    };
    try {
      if (isNew) {
        await createMutation.mutateAsync(data as Partial<PricingGrid>);
        showToast("Price list created");
      } else {
        await updateMutation.mutateAsync({ id: id!, ...data } as { id: string } & Partial<PricingGrid>);
        showToast("Price list updated");
      }
      navigate("/price-lists");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", { isError: true });
    }
  };

  const templateOptions = [
    { label: "Select template...", value: "" },
    ...(templates?.map((t) => ({ label: t.name, value: t.id })) || []),
  ];

  const fabricOptions = [
    { label: "None", value: "" },
    ...(fabrics?.map((f) => ({ label: f.name, value: f.id })) || []),
  ];

  if (!isNew && isLoading) {
    return (
      <SkeletonPage title="Loading..." backAction>
        <Card><SkeletonBodyText lines={6} /></Card>
        <Card><SkeletonBodyText lines={10} /></Card>
      </SkeletonPage>
    );
  }

  return (
    <Page
      title={isNew ? "New Price List" : "Edit Price List"}
      backAction={{ content: "Price Lists", onAction: () => navigate("/price-lists") }}
      primaryAction={{ content: "Save", onAction: handleSave }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Settings</Text>
            <FormLayout>
              <FormLayout.Group>
                <Select label="Product Template" options={templateOptions} value={templateId} onChange={setTemplateId} />
                <Select label="Fabric (optional)" options={fabricOptions} value={fabricId} onChange={setFabricId} />
                <TextField label="Roll Width (mm)" type="number" value={String(rollWidth ?? "")} onChange={(val) => setRollWidth(val ? Number(val) : null)} autoComplete="off" />
              </FormLayout.Group>
              <FormLayout.Group>
                <TextField label="Price per sqm" type="number" value={String(priceSqm ?? "")} onChange={(val) => setPriceSqm(val ? Number(val) : null)} autoComplete="off" />
                <TextField label="Price per linear metre" type="number" value={String(priceLm ?? "")} onChange={(val) => setPriceLm(val ? Number(val) : null)} autoComplete="off" />
                <TextField label="Pattern Repeat (mm)" type="number" value={String(patternRepeat ?? "")} onChange={(val) => setPatternRepeat(val ? Number(val) : null)} autoComplete="off" />
              </FormLayout.Group>
            </FormLayout>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Price Grid</Text>
              <ButtonGroup>
                <Button icon={PlusCircleIcon} size="slim" onClick={addWidthBand}>Width</Button>
                <Button icon={PlusCircleIcon} size="slim" onClick={addDropBand}>Drop</Button>
                <Button icon={ExportIcon} size="slim" onClick={exportCsv}>CSV</Button>
                <Button icon={ImportIcon} size="slim" onClick={() => fileInputRef.current?.click()}>Import</Button>
              </ButtonGroup>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={importCsv}
              />
            </InlineStack>

            {widthBands.length > 0 && dropBands.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "4px", fontSize: "var(--p-font-size-300)", color: "var(--p-color-text-subdued)" }}>
                        Drop \ Width
                      </th>
                      {widthBands.map((w, wi) => (
                        <th key={wi} style={{ padding: "4px" }}>
                          <InlineStack gap="100" blockAlign="center">
                            <input
                              type="number"
                              style={headerCellStyle}
                              value={w}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > 0) setWidthBands((prev) => { const next = [...prev]; next[wi] = val; return next; });
                              }}
                            />
                            <Button icon={DeleteIcon} variant="plain" tone="critical" size="micro" onClick={() => removeWidthBand(wi)} accessibilityLabel="Remove width band" />
                          </InlineStack>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dropBands.map((d, di) => (
                      <tr key={di}>
                        <td style={{ padding: "4px" }}>
                          <InlineStack gap="100" blockAlign="center">
                            <input
                              type="number"
                              style={headerCellStyle}
                              value={d}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > 0) setDropBands((prev) => { const next = [...prev]; next[di] = val; return next; });
                              }}
                            />
                            <Button icon={DeleteIcon} variant="plain" tone="critical" size="micro" onClick={() => removeDropBand(di)} accessibilityLabel="Remove drop band" />
                          </InlineStack>
                        </td>
                        {widthBands.map((_, wi) => (
                          <td key={wi} style={{ padding: "4px" }}>
                            <GridCell
                              value={matrix[di]?.[wi] ?? 0}
                              onChange={(val) => updateCell(di, wi, val)}
                              onKeyDown={(e) => handleCellKeyDown(e, di, wi)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Text as="p" tone="subdued" alignment="center">
                Add width and drop bands to start building your price grid.
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
