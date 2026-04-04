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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList } from "@/hooks/useApi";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { toast } from "sonner";
import type { ShopifyProduct, ProductTemplate } from "@/lib/types";
import { Link2, Unlink } from "lucide-react";

export default function ShopifyProductsPage() {
  const { data: products, isLoading, refetch } = useApiList<ShopifyProduct>("products");
  const { data: templates } = useApiList<ProductTemplate>("templates");
  const fetch = useAuthenticatedFetch();
  const [linking, setLinking] = useState<string | null>(null);

  const handleLink = async (productId: string, templateId: string) => {
    setLinking(productId);
    try {
      await fetch(`/api/products/${productId}/metafields`, {
        method: "POST",
        body: JSON.stringify({ template_id: templateId }),
      });
      toast.success("Product linked to template");
      refetch();
    } catch {
      toast.error("Failed to link product");
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (productId: string) => {
    setLinking(productId);
    try {
      await fetch(`/api/products/${productId}/metafields`, {
        method: "POST",
        body: JSON.stringify({ template_id: null }),
      });
      toast.success("Product unlinked");
      refetch();
    } catch {
      toast.error("Failed to unlink product");
    } finally {
      setLinking(null);
    }
  };

  return (
    <PageLayout
      title="Shopify Products"
      description="Link your Shopify products to MeasureRight templates"
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !products?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              No products found in your Shopify store.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Linked Template</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image.src}
                            alt={product.image.alt || product.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                        <span className="font-medium">{product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.vendor}</TableCell>
                    <TableCell>{product.product_type}</TableCell>
                    <TableCell>
                      {product.template_id ? (
                        <Badge variant="success">
                          <Link2 className="h-3 w-3 mr-1" />
                          {templates?.find((t) => t.id === product.template_id)?.name || "Linked"}
                        </Badge>
                      ) : (
                        <Select
                          onValueChange={(val) => handleLink(product.id, val)}
                          disabled={linking === product.id}
                        >
                          <SelectTrigger className="w-48">
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
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.template_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlink(product.id)}
                          disabled={linking === product.id}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Unlink
                        </Button>
                      )}
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
