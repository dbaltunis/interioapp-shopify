import { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiGet, useApiCreate, useApiUpdate, useApiList } from "@/hooks/useApi";
import { toast } from "sonner";
import type { PricingGrid, ProductTemplate, Fabric } from "@/lib/types";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import Papa from "papaparse";

// Flat array <-> 2D matrix helpers
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

// Memoized cell to prevent unnecessary re-renders
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
      className="w-20 h-8 px-1 text-right text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
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

  // Initialize matrix when bands change
  const initMatrix = useCallback(() => {
    setMatrix(
      dropBands.map(() => widthBands.map(() => 0))
    );
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

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    dropIdx: number,
    widthIdx: number
  ) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const nextW = widthIdx + 1;
      const nextD = dropIdx + 1;
      let nextCell: HTMLInputElement | null = null;
      if (nextW < widthBands.length) {
        nextCell = target
          .closest("tr")
          ?.querySelectorAll("input")[nextW] as HTMLInputElement;
      } else if (nextD < dropBands.length) {
        nextCell = target
          .closest("tbody")
          ?.querySelectorAll("tr")
          [nextD]?.querySelector("input") as HTMLInputElement;
      }
      nextCell?.focus();
      nextCell?.select();
    }
  };

  const addWidthBand = () => {
    const lastBand = widthBands[widthBands.length - 1] || 0;
    const newBand = lastBand + 300;
    setWidthBands([...widthBands, newBand]);
    setMatrix((prev) => prev.map((row) => [...row, 0]));
  };

  const addDropBand = () => {
    const lastBand = dropBands[dropBands.length - 1] || 0;
    const newBand = lastBand + 500;
    setDropBands([...dropBands, newBand]);
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
          toast.success("CSV imported successfully");
        } catch {
          toast.error("Invalid CSV format");
        }
      },
      error: () => toast.error("Failed to parse CSV"),
    });
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!templateId) {
      toast.error("Please select a template");
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
        toast.success("Price list created");
      } else {
        await updateMutation.mutateAsync({ id: id!, ...data } as { id: string } & Partial<PricingGrid>);
        toast.success("Price list updated");
      }
      navigate("/price-lists");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  if (!isNew && isLoading) {
    return (
      <PageLayout title="Loading..." backTo="/price-lists">
        <Skeleton className="h-96 w-full" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isNew ? "New Price List" : "Edit Price List"}
      backTo="/price-lists"
      action={{ label: "Save", onClick: handleSave }}
    >
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Product Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fabric (optional)</Label>
            <Select value={fabricId || "none"} onValueChange={(val) => setFabricId(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Any fabric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {fabrics?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Roll Width (mm)</Label>
            <Input
              type="number"
              value={rollWidth ?? ""}
              onChange={(e) => setRollWidth(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Price per sqm</Label>
            <Input
              type="number"
              step="0.01"
              value={priceSqm ?? ""}
              onChange={(e) => setPriceSqm(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Price per linear metre</Label>
            <Input
              type="number"
              step="0.01"
              value={priceLm ?? ""}
              onChange={(e) => setPriceLm(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pattern Repeat (mm)</Label>
            <Input
              type="number"
              value={patternRepeat ?? ""}
              onChange={(e) => setPatternRepeat(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Price Grid</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addWidthBand}>
              <Plus className="h-4 w-4 mr-1" /> Width
            </Button>
            <Button variant="outline" size="sm" onClick={addDropBand}>
              <Plus className="h-4 w-4 mr-1" /> Drop
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" /> Import
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importCsv}
              />
            </label>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {widthBands.length > 0 && dropBands.length > 0 ? (
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-sm font-medium text-muted-foreground">
                    Drop \ Width
                  </th>
                  {widthBands.map((w, wi) => (
                    <th key={wi} className="p-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-20 h-8 px-1 text-center text-sm font-medium border rounded bg-muted"
                          value={w}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                              setWidthBands((prev) => {
                                const next = [...prev];
                                next[wi] = val;
                                return next;
                              });
                            }
                          }}
                        />
                        <button
                          onClick={() => removeWidthBand(wi)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dropBands.map((d, di) => (
                  <tr key={di}>
                    <td className="p-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-20 h-8 px-1 text-center text-sm font-medium border rounded bg-muted"
                          value={d}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                              setDropBands((prev) => {
                                const next = [...prev];
                                next[di] = val;
                                return next;
                              });
                            }
                          }}
                        />
                        <button
                          onClick={() => removeDropBand(di)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    {widthBands.map((_, wi) => (
                      <td key={wi} className="p-1">
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
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Add width and drop bands to start building your price grid.
            </p>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
