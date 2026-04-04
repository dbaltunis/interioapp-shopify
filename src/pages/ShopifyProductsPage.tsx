import { useState } from "react";
import {
  Page,
  Card,
  IndexTable,
  Badge,
  Button,
  Select,
  Thumbnail,
  SkeletonBodyText,
  EmptyState,
  InlineStack,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { useApiList } from "@/hooks/useApi";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { showToast } from "@/lib/toast";
import type { ShopifyProduct, ProductTemplate } from "@/lib/types";

export default function ShopifyProductsPage() {
  const { data: products, isLoading, refetch } = useApiList<ShopifyProduct>("products");
  const { data: templates } = useApiList<ProductTemplate>("templates");
  const fetch = useAuthenticatedFetch();
  const [linking, setLinking] = useState<string | null>(null);

  const templateOptions = [
    { label: "Select template...", value: "" },
    ...(templates?.map((t) => ({ label: t.name, value: t.id })) || []),
  ];

  const handleLink = async (productId: string, templateId: string) => {
    if (!templateId) return;
    setLinking(productId);
    try {
      await fetch(`/api/products/${productId}/metafields`, {
        method: "POST",
        body: JSON.stringify({ template_id: templateId }),
      });
      showToast("Product linked to template");
      refetch();
    } catch {
      showToast("Failed to link product", { isError: true });
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
      showToast("Product unlinked");
      refetch();
    } catch {
      showToast("Failed to unlink product", { isError: true });
    } finally {
      setLinking(null);
    }
  };

  const resourceName = { singular: "product", plural: "products" };

  return (
    <Page title="Shopify Products" subtitle="Link your Shopify products to MeasureRight templates">
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={5} />
          </div>
        ) : !products?.length ? (
          <EmptyState heading="No products found" image="">
            <p>No products found in your Shopify store.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={products.length}
            headings={[
              { title: "Product" },
              { title: "Vendor" },
              { title: "Type" },
              { title: "Linked Template" },
              { title: "Actions", alignment: "end" },
            ]}
            selectable={false}
          >
            {products.map((product, index) => (
              <IndexTable.Row
                id={product.id}
                key={product.id}
                position={index}
              >
                <IndexTable.Cell>
                  <InlineStack gap="300" blockAlign="center">
                    <Thumbnail
                      source={product.image?.src || ImageIcon}
                      alt={product.image?.alt || product.title}
                      size="small"
                    />
                    <span style={{ fontWeight: 600 }}>{product.title}</span>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>{product.vendor}</IndexTable.Cell>
                <IndexTable.Cell>{product.product_type}</IndexTable.Cell>
                <IndexTable.Cell>
                  {product.template_id ? (
                    <Badge tone="success">
                      {templates?.find((t) => t.id === product.template_id)?.name || "Linked"}
                    </Badge>
                  ) : (
                    <div style={{ maxWidth: "200px" }}>
                      <Select
                        label=""
                        labelHidden
                        options={templateOptions}
                        value=""
                        onChange={(val) => handleLink(product.id, val)}
                        disabled={linking === product.id}
                      />
                    </div>
                  )}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {product.template_id && (
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={() => handleUnlink(product.id)}
                      disabled={linking === product.id}
                    >
                      Unlink
                    </Button>
                  )}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>
    </Page>
  );
}
