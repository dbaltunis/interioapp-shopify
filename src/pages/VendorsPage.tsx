import { useState } from "react";
import {
  Page,
  Card,
  IndexTable,
  Button,
  Modal,
  FormLayout,
  TextField,
  SkeletonBodyText,
  EmptyState,
  InlineStack,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { useApiList, useApiCreate, useApiUpdate, useApiDelete } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
import type { Vendor } from "@/lib/types";

type VendorForm = Partial<Vendor>;

export default function VendorsPage() {
  const { data: vendors, isLoading } = useApiList<Vendor>("vendors");
  const createMutation = useApiCreate<Vendor>("vendors");
  const updateMutation = useApiUpdate<Vendor>("vendors");
  const deleteMutation = useApiDelete("vendors");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>({});

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "", contact_name: "", website: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setForm(vendor);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast("Name is required", { isError: true });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form } as { id: string } & Partial<Vendor>);
        showToast("Vendor updated");
      } else {
        await createMutation.mutateAsync(form as Partial<Vendor>);
        showToast("Vendor created");
      }
      setDialogOpen(false);
    } catch {
      showToast("Failed to save vendor", { isError: true });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete vendor "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(`Vendor "${name}" deleted`);
    } catch {
      showToast("Failed to delete vendor", { isError: true });
    }
  };

  const resourceName = { singular: "vendor", plural: "vendors" };

  return (
    <Page
      title="Vendors"
      subtitle="Manage your suppliers and vendors"
      primaryAction={{ content: "Add Vendor", onAction: openNew }}
    >
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={3} />
          </div>
        ) : !vendors?.length ? (
          <EmptyState
            heading="No vendors yet"
            action={{ content: "Add Vendor", onAction: openNew }}
            image=""
          >
            <p>Add your first vendor or supplier.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={vendors.length}
            headings={[
              { title: "Name" },
              { title: "Contact" },
              { title: "Email" },
              { title: "Phone" },
              { title: "Actions", alignment: "end" },
            ]}
            selectable={false}
          >
            {vendors.map((v, index) => (
              <IndexTable.Row id={v.id} key={v.id} position={index}>
                <IndexTable.Cell>
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>{v.contact_name || "—"}</IndexTable.Cell>
                <IndexTable.Cell>{v.email || "—"}</IndexTable.Cell>
                <IndexTable.Cell>{v.phone || "—"}</IndexTable.Cell>
                <IndexTable.Cell>
                  <InlineStack gap="100" align="end">
                    <Button icon={EditIcon} variant="plain" onClick={() => openEdit(v)} accessibilityLabel={`Edit ${v.name}`} />
                    <Button icon={DeleteIcon} variant="plain" tone="critical" onClick={() => handleDelete(v.id, v.name)} accessibilityLabel={`Delete ${v.name}`} />
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
        title={editingId ? "Edit Vendor" : "New Vendor"}
        primaryAction={{ content: editingId ? "Save" : "Create", onAction: handleSave }}
        secondaryActions={[{ content: "Cancel", onAction: () => setDialogOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Name" value={form.name || ""} onChange={(val) => setForm({ ...form, name: val })} autoComplete="off" />
            <TextField label="Contact Name" value={form.contact_name || ""} onChange={(val) => setForm({ ...form, contact_name: val })} autoComplete="off" />
            <TextField label="Email" type="email" value={form.email || ""} onChange={(val) => setForm({ ...form, email: val })} autoComplete="off" />
            <TextField label="Phone" value={form.phone || ""} onChange={(val) => setForm({ ...form, phone: val })} autoComplete="off" />
            <TextField label="Website" value={form.website || ""} onChange={(val) => setForm({ ...form, website: val })} autoComplete="off" />
            <TextField label="Notes" value={form.notes || ""} onChange={(val) => setForm({ ...form, notes: val })} multiline={3} autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
