import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  BlockStack,
  FormLayout,
  TextField,
  Select,
  Text,
  SkeletonPage,
  SkeletonBodyText,
} from "@shopify/polaris";
import { useApiGet, useApiCreate, useApiUpdate, useApiList } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
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
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
    name: "", code: "", category: "blind", pricing_model: "grid",
    min_width: 300, max_width: 3000, min_drop: 300, max_drop: 3000,
    wastage_percent: 0, labour_cost: 0, installation_cost: 0,
  });

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && isNew) next.code = slugify(value as string);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      showToast("Name and code are required", { isError: true });
      return;
    }
    try {
      if (isNew) {
        await createMutation.mutateAsync(form as Partial<ProductTemplate>);
        showToast("Template created");
      } else {
        await updateMutation.mutateAsync({ id: id!, ...form } as { id: string } & Partial<ProductTemplate>);
        showToast("Template updated");
      }
      navigate("/templates");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", { isError: true });
    }
  };

  const vendorOptions = [
    { label: "Select vendor...", value: "" },
    ...(vendors?.map((v) => ({ label: v.name, value: v.id })) || []),
  ];

  const gridOptions = [
    { label: "Select grid...", value: "" },
    ...(grids?.map((g) => ({ label: `Grid ${g.width_bands?.length}x${g.drop_bands?.length}`, value: g.id })) || []),
  ];

  if (!isNew && isLoading) {
    return (
      <SkeletonPage title="Loading..." backAction>
        <Card><SkeletonBodyText lines={6} /></Card>
        <Card><SkeletonBodyText lines={4} /></Card>
      </SkeletonPage>
    );
  }

  return (
    <Page
      title={isNew ? "New Template" : `Edit: ${form.name}`}
      backAction={{ content: "Templates", onAction: () => navigate("/templates") }}
      primaryAction={{ content: isNew ? "Create Template" : "Save Changes", onAction: handleSave }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Basic Information</Text>
            <FormLayout>
              <FormLayout.Group>
                <TextField label="Name" value={form.name || ""} onChange={(val) => updateField("name", val)} placeholder="e.g. Roller Blind" autoComplete="off" />
                <TextField label="Code" value={form.code || ""} onChange={(val) => updateField("code", val)} placeholder="e.g. roller-blind" autoComplete="off" monospaced />
              </FormLayout.Group>
              <FormLayout.Group>
                <TextField label="SKU Prefix" value={form.sku || ""} onChange={(val) => updateField("sku", val)} placeholder="Optional" autoComplete="off" />
                <Select label="Category" options={CATEGORIES} value={form.category || "blind"} onChange={(val) => updateField("category", val as ProductTemplate["category"])} />
              </FormLayout.Group>
              <FormLayout.Group>
                <Select label="Pricing Model" options={PRICING_MODELS} value={form.pricing_model || "grid"} onChange={(val) => updateField("pricing_model", val as ProductTemplate["pricing_model"])} />
                <Select label="Vendor" options={vendorOptions} value={form.vendor_id || ""} onChange={(val) => updateField("vendor_id", val)} />
              </FormLayout.Group>
            </FormLayout>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Dimensions (mm)</Text>
            <FormLayout>
              <FormLayout.Group>
                <TextField label="Min Width" type="number" value={String(form.min_width ?? "")} onChange={(val) => updateField("min_width", Number(val))} autoComplete="off" />
                <TextField label="Max Width" type="number" value={String(form.max_width ?? "")} onChange={(val) => updateField("max_width", Number(val))} autoComplete="off" />
              </FormLayout.Group>
              <FormLayout.Group>
                <TextField label="Min Drop" type="number" value={String(form.min_drop ?? "")} onChange={(val) => updateField("min_drop", Number(val))} autoComplete="off" />
                <TextField label="Max Drop" type="number" value={String(form.max_drop ?? "")} onChange={(val) => updateField("max_drop", Number(val))} autoComplete="off" />
              </FormLayout.Group>
            </FormLayout>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Pricing & Costs</Text>
            <FormLayout>
              <FormLayout.Group>
                <Select label="Default Grid" options={gridOptions} value={form.default_grid_id || ""} onChange={(val) => updateField("default_grid_id", val)} />
                <TextField label="Wastage %" type="number" value={String(form.wastage_percent ?? "")} onChange={(val) => updateField("wastage_percent", Number(val))} autoComplete="off" />
                <TextField label="Labour Cost" type="number" value={String(form.labour_cost ?? "")} onChange={(val) => updateField("labour_cost", Number(val))} autoComplete="off" />
              </FormLayout.Group>
              <FormLayout.Group>
                <TextField label="Installation Cost" type="number" value={String(form.installation_cost ?? "")} onChange={(val) => updateField("installation_cost", Number(val))} autoComplete="off" />
                <TextField label="Pricing Formula" value={form.pricing_formula || ""} onChange={(val) => updateField("pricing_formula", val)} placeholder="Optional custom formula..." multiline={2} autoComplete="off" />
              </FormLayout.Group>
            </FormLayout>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
