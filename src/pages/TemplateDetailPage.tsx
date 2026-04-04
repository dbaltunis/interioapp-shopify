import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import type { ProductTemplate, Vendor, PricingGrid } from "@/lib/types";

const CATEGORIES = [
  { value: "blind", label: "Blind" },
  { value: "curtain", label: "Curtain" },
  { value: "shutter", label: "Shutter" },
  { value: "awning", label: "Awning" },
];

const PRICING_MODELS = [
  { value: "area", label: "Area" },
  { value: "grid", label: "Grid" },
  { value: "sqm", label: "Per Square Metre" },
  { value: "linear_metre", label: "Per Linear Metre" },
  { value: "fixed", label: "Fixed Price" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FormData = Partial<ProductTemplate>;

export default function TemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const { data: existing, isLoading } = useApiGet<ProductTemplate>("templates", isNew ? undefined : id);
  const { data: vendors } = useApiList<Vendor>("vendors");
  const { data: grids } = useApiList<PricingGrid>("grids");
  const createMutation = useApiCreate<ProductTemplate>("templates");
  const updateMutation = useApiUpdate<ProductTemplate>("templates");

  const [form, setForm] = useState<FormData>({
    name: "",
    code: "",
    category: "blind",
    pricing_model: "grid",
    min_width: 300,
    max_width: 3000,
    min_drop: 300,
    max_drop: 3000,
    wastage_percent: 0,
    labour_cost: 0,
    installation_cost: 0,
  });

  useEffect(() => {
    if (existing) {
      setForm(existing);
    }
  }, [existing]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && isNew) {
        next.code = slugify(value as string);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error("Name and code are required");
      return;
    }
    try {
      if (isNew) {
        await createMutation.mutateAsync(form as Partial<ProductTemplate>);
        toast.success("Template created");
      } else {
        await updateMutation.mutateAsync({ id: id!, ...form } as { id: string } & Partial<ProductTemplate>);
        toast.success("Template updated");
      }
      navigate("/templates");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  if (!isNew && isLoading) {
    return (
      <PageLayout title="Loading..." backTo="/templates">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isNew ? "New Template" : `Edit: ${form.name}`}
      backTo="/templates"
      action={{
        label: isNew ? "Create Template" : "Save Changes",
        onClick: handleSave,
      }}
    >
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Roller Blind"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={form.code || ""}
              onChange={(e) => updateField("code", e.target.value)}
              placeholder="e.g. roller-blind"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU Prefix</Label>
            <Input
              id="sku"
              value={form.sku || ""}
              onChange={(e) => updateField("sku", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category || "blind"}
              onValueChange={(val) => updateField("category", val as ProductTemplate["category"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pricing Model</Label>
            <Select
              value={form.pricing_model || "grid"}
              onValueChange={(val) => updateField("pricing_model", val as ProductTemplate["pricing_model"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select
              value={form.vendor_id || ""}
              onValueChange={(val) => updateField("vendor_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimensions (mm)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Min Width</Label>
            <Input
              type="number"
              value={form.min_width ?? ""}
              onChange={(e) => updateField("min_width", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Width</Label>
            <Input
              type="number"
              value={form.max_width ?? ""}
              onChange={(e) => updateField("max_width", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Min Drop</Label>
            <Input
              type="number"
              value={form.min_drop ?? ""}
              onChange={(e) => updateField("min_drop", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Drop</Label>
            <Input
              type="number"
              value={form.max_drop ?? ""}
              onChange={(e) => updateField("max_drop", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing & Costs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Default Grid</Label>
            <Select
              value={form.default_grid_id || ""}
              onValueChange={(val) => updateField("default_grid_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grid..." />
              </SelectTrigger>
              <SelectContent>
                {grids?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    Grid {g.width_bands?.length}x{g.drop_bands?.length}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Wastage %</Label>
            <Input
              type="number"
              value={form.wastage_percent ?? ""}
              onChange={(e) => updateField("wastage_percent", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Labour Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={form.labour_cost ?? ""}
              onChange={(e) => updateField("labour_cost", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Installation Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={form.installation_cost ?? ""}
              onChange={(e) => updateField("installation_cost", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Pricing Formula</Label>
            <Textarea
              value={form.pricing_formula || ""}
              onChange={(e) => updateField("pricing_formula", e.target.value)}
              placeholder="Optional custom formula..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
