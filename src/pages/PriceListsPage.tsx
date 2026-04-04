import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList, useApiDelete } from "@/hooks/useApi";
import { toast } from "sonner";
import type { PricingGrid, ProductTemplate, Fabric } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

export default function PriceListsPage() {
  const navigate = useNavigate();
  const { data: grids, isLoading } = useApiList<PricingGrid>("grids");
  const { data: templates } = useApiList<ProductTemplate>("templates");
  const { data: fabrics } = useApiList<Fabric>("fabrics");
  const deleteMutation = useApiDelete("grids");

  const getTemplateName = (id: string) =>
    templates?.find((t) => t.id === id)?.name || "Unknown";
  const getFabricName = (id: string | null) =>
    id ? fabrics?.find((f) => f.id === id)?.name || "Unknown" : "—";

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pricing grid?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Grid deleted");
    } catch {
      toast.error("Failed to delete grid");
    }
  };

  return (
    <PageLayout
      title="Price Lists"
      description="Manage pricing grids for your products"
      action={{ label: "Add Price List", onClick: () => navigate("/price-lists/new") }}
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !grids?.length ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No pricing grids yet.</p>
              <Button onClick={() => navigate("/price-lists/new")}>
                Create Price List
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Fabric</TableHead>
                  <TableHead>Grid Size</TableHead>
                  <TableHead>Price/sqm</TableHead>
                  <TableHead>Price/lm</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grids.map((g) => (
                  <TableRow
                    key={g.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/price-lists/${g.id}`)}
                  >
                    <TableCell className="font-medium">
                      {getTemplateName(g.product_template_id)}
                    </TableCell>
                    <TableCell>{getFabricName(g.fabric_id)}</TableCell>
                    <TableCell>
                      {g.width_bands?.length || 0} x {g.drop_bands?.length || 0}
                    </TableCell>
                    <TableCell>
                      {g.price_per_sqm != null ? `$${g.price_per_sqm}` : "—"}
                    </TableCell>
                    <TableCell>
                      {g.price_per_linear_metre != null ? `$${g.price_per_linear_metre}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/price-lists/${g.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(g.id)}
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
    </PageLayout>
  );
}
