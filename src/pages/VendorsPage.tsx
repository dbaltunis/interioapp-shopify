import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList, useApiCreate, useApiUpdate, useApiDelete } from "@/hooks/useApi";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

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
    setForm({ name: "", contact_email: "", contact_phone: "", address: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setForm(vendor);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form } as { id: string } & Partial<Vendor>);
        toast.success("Vendor updated");
      } else {
        await createMutation.mutateAsync(form as Partial<Vendor>);
        toast.success("Vendor created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save vendor");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete vendor "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Vendor "${name}" deleted`);
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  return (
    <PageLayout
      title="Vendors"
      description="Manage your suppliers and vendors"
      action={{ label: "Add Vendor", onClick: openNew }}
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !vendors?.length ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No vendors yet.</p>
              <Button onClick={openNew}>Add Vendor</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.contact_email || "—"}</TableCell>
                    <TableCell>{v.contact_phone || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {v.address || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(v.id, v.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vendor" : "New Vendor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.contact_email || ""}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.contact_phone || ""}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
