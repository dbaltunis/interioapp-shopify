import { useState } from "react";
import {
  Page,
  Card,
  IndexTable,
  Badge,
  Button,
  Modal,
  FormLayout,
  TextField,
  Tag,
  InlineStack,
  BlockStack,
  SkeletonBodyText,
  EmptyState,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { useApiList, useApiCreate, useApiUpdate, useApiDelete } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
import type { Fabric } from "@/lib/types";

type FabricForm = Partial<Fabric>;

export default function FabricsPage() {
  const { data: fabrics, isLoading } = useApiList<Fabric>("fabrics");
  const createMutation = useApiCreate<Fabric>("fabrics");
  const updateMutation = useApiUpdate<Fabric>("fabrics");
  const deleteMutation = useApiDelete("fabrics");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FabricForm>({});
  const [colourInput, setColourInput] = useState("");

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", category: "", colours: [], roll_width: undefined, price_per_sqm: undefined, price_per_linear_metre: undefined, surcharge: 0 });
    setDialogOpen(true);
  };

  const openEdit = (fabric: Fabric) => {
    setEditingId(fabric.id);
    setForm(fabric);
    setDialogOpen(true);
  };

  const addColour = () => {
    const colour = colourInput.trim();
    if (!colour || form.colours?.includes(colour)) return;
    setForm({ ...form, colours: [...(form.colours || []), colour] });
    setColourInput("");
  };

  const removeColour = (colour: string) => {
    setForm({ ...form, colours: form.colours?.filter((c) => c !== colour) || [] });
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast("Name is required", { isError: true });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form } as { id: string } & Partial<Fabric>);
        showToast("Fabric updated");
      } else {
        await createMutation.mutateAsync(form as Partial<Fabric>);
        showToast("Fabric created");
      }
      setDialogOpen(false);
    } catch {
      showToast("Failed to save fabric", { isError: true });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete fabric "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(`Fabric "${name}" deleted`);
    } catch {
      showToast("Failed to delete fabric", { isError: true });
    }
  };

  const resourceName = { singular: "fabric", plural: "fabrics" };

  return (
    <Page
      title="Fabrics"
      subtitle="Optional pricing modifiers for your calculator — add surcharges or fabric-specific pricing grids"
      primaryAction={{ content: "Add Fabric", onAction: openNew }}
    >
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={3} />
          </div>
        ) : !fabrics?.length ? (
          <EmptyState
            heading="No fabrics added"
            action={{ content: "Add Fabric", onAction: openNew }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>
              Fabrics are optional. Add them if your products offer fabric selection
              with per-fabric pricing or surcharges.
            </p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={fabrics.length}
            headings={[
              { title: "Name" },
              { title: "Category" },
              { title: "Colours" },
              { title: "Roll Width" },
              { title: "Price/sqm" },
              { title: "Price/lm" },
              { title: "Surcharge" },
              { title: "Actions", alignment: "end" },
            ]}
            selectable={false}
          >
            {fabrics.map((f, index) => (
              <IndexTable.Row id={f.id} key={f.id} position={index}>
                <IndexTable.Cell>
                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>{f.category || "\u2014"}</IndexTable.Cell>
                <IndexTable.Cell>
                  <InlineStack gap="100">
                    {f.colours?.slice(0, 3).map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                    {(f.colours?.length || 0) > 3 && (
                      <Badge tone="info">{`+${f.colours!.length - 3}`}</Badge>
                    )}
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>{f.roll_width ? `${f.roll_width}mm` : "\u2014"}</IndexTable.Cell>
                <IndexTable.Cell>{f.price_per_sqm != null ? `$${f.price_per_sqm}` : "\u2014"}</IndexTable.Cell>
                <IndexTable.Cell>{f.price_per_linear_metre != null ? `$${f.price_per_linear_metre}` : "\u2014"}</IndexTable.Cell>
                <IndexTable.Cell>{f.surcharge ? `$${f.surcharge}` : "\u2014"}</IndexTable.Cell>
                <IndexTable.Cell>
                  <InlineStack gap="100" align="end">
                    <Button icon={EditIcon} variant="plain" onClick={() => openEdit(f)} accessibilityLabel={`Edit ${f.name}`} />
                    <Button icon={DeleteIcon} variant="plain" tone="critical" onClick={() => handleDelete(f.id, f.name)} accessibilityLabel={`Delete ${f.name}`} />
                  </InlineStack>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Fabric" : "New Fabric"}
        primaryAction={{ content: editingId ? "Save" : "Create", onAction: handleSave }}
        secondaryActions={[{ content: "Cancel", onAction: () => setDialogOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <FormLayout.Group>
              <TextField label="Name" value={form.name || ""} onChange={(val) => setForm({ ...form, name: val })} autoComplete="off" />
              <TextField label="Category" value={form.category || ""} onChange={(val) => setForm({ ...form, category: val })} autoComplete="off" placeholder="e.g. Blockout, Sheer" />
            </FormLayout.Group>

            <BlockStack gap="200">
              <TextField
                label="Colours"
                value={colourInput}
                onChange={setColourInput}
                onBlur={addColour}
                autoComplete="off"
                placeholder="Type a colour and press Enter"
                connectedRight={<Button onClick={addColour}>Add</Button>}
              />
              {form.colours && form.colours.length > 0 && (
                <InlineStack gap="200">
                  {form.colours.map((c) => (
                    <Tag key={c} onRemove={() => removeColour(c)}>{c}</Tag>
                  ))}
                </InlineStack>
              )}
            </BlockStack>

            <FormLayout.Group>
              <TextField label="Roll Width (mm)" type="number" value={String(form.roll_width ?? "")} onChange={(val) => setForm({ ...form, roll_width: val ? Number(val) : undefined })} autoComplete="off" />
              <TextField label="Price per sqm" type="number" value={String(form.price_per_sqm ?? "")} onChange={(val) => setForm({ ...form, price_per_sqm: val ? Number(val) : undefined })} autoComplete="off" />
            </FormLayout.Group>
            <FormLayout.Group>
              <TextField label="Price per linear metre" type="number" value={String(form.price_per_linear_metre ?? "")} onChange={(val) => setForm({ ...form, price_per_linear_metre: val ? Number(val) : undefined })} autoComplete="off" />
              <TextField label="Surcharge" type="number" value={String(form.surcharge ?? 0)} onChange={(val) => setForm({ ...form, surcharge: Number(val) })} autoComplete="off" />
            </FormLayout.Group>
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
