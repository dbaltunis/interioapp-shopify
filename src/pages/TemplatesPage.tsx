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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList, useApiDelete } from "@/hooks/useApi";
import { toast } from "sonner";
import type { ProductTemplate } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useApiList<ProductTemplate>("templates");
  const deleteMutation = useApiDelete("templates");

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Template "${name}" deleted`);
    } catch {
      toast.error("Failed to delete template");
    }
  };

  return (
    <PageLayout
      title="Product Templates"
      description="Manage your made-to-measure product configurations"
      action={{ label: "Add Template", onClick: () => navigate("/templates/new") }}
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !templates?.length ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No templates yet. Create your first product template.
              </p>
              <Button onClick={() => navigate("/templates/new")}>
                Create Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing Model</TableHead>
                  <TableHead>Dimensions (mm)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/templates/${t.id}`)}
                  >
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {t.pricing_model?.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      W: {t.min_width}–{t.max_width} | D: {t.min_drop}–{t.max_drop}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/templates/${t.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(t.id, t.name)}
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
