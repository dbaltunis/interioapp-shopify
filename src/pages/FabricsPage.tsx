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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList, useApiCreate, useApiUpdate, useApiDelete } from "@/hooks/useApi";
import { toast } from "sonner";
import type { Fabric } from "@/lib/types";
import { Pencil, Trash2, X } from "lucide-react";

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
    setForm({
      name: "",
      category: "",
      colours: [],
      roll_width: null,
      price_per_sqm: null,
      price_per_linear_metre: null,
      surcharge: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (fabric: Fabric) => {
    setEditingId(fabric.id);
    setForm(fabric);
    setDialogOpen(true);
  };

  const addColour = () => {
    const colour = colourInput.trim();
    if (!colour) return;
    if (form.colours?.includes(colour)) return;
    setForm({ ...form, colours: [...(form.colours || []), colour] });
    setColourInput("");
  };

  const removeColour = (colour: string) => {
    setForm({ ...form, colours: form.colours?.filter((c) => c !== colour) || [] });
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form } as { id: string } & Partial<Fabric>);
        toast.success("Fabric updated");
      } else {
        await createMutation.mutateAsync(form as Partial<Fabric>);
        toast.success("Fabric created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save fabric");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete fabric "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Fabric "${name}" deleted`);
    } catch {
      toast.error("Failed to delete fabric");
    }
  };

  return (
    <PageLayout
      title="Fabrics"
      description="Manage your fabric catalogue"
      action={{ label: "Add Fabric", onClick: openNew }}
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !fabrics?.length ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No fabrics yet.</p>
              <Button onClick={openNew}>Add Fabric</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Colours</TableHead>
                  <TableHead>Roll Width</TableHead>
                  <TableHead>Price/sqm</TableHead>
                  <TableHead>Price/lm</TableHead>
                  <TableHead>Surcharge</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fabrics.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.category || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {f.colours?.slice(0, 3).map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                        {(f.colours?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{f.colours!.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{f.roll_width ? `${f.roll_width}mm` : "—"}</TableCell>
                    <TableCell>{f.price_per_sqm != null ? `$${f.price_per_sqm}` : "—"}</TableCell>
                    <TableCell>
                      {f.price_per_linear_metre != null ? `$${f.price_per_linear_metre}` : "—"}
                    </TableCell>
                    <TableCell>{f.surcharge ? `$${f.surcharge}` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(f.id, f.name)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Fabric" : "New Fabric"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category || ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Blockout, Sheer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Colours</Label>
              <div className="flex gap-2">
                <Input
                  value={colourInput}
                  onChange={(e) => setColourInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColour())}
                  placeholder="Type a colour and press Enter"
                />
                <Button type="button" variant="outline" onClick={addColour}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.colours?.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1">
                    {c}
                    <button onClick={() => removeColour(c)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll Width (mm)</Label>
                <Input
                  type="number"
                  value={form.roll_width ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, roll_width: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Price per sqm</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_per_sqm ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, price_per_sqm: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Price per linear metre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_per_linear_metre ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price_per_linear_metre: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Surcharge</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.surcharge ?? 0}
                  onChange={(e) => setForm({ ...form, surcharge: Number(e.target.value) })}
                />
              </div>
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
