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
  BlockStack,
  Text,
  Banner,
  Modal,
  FormLayout,
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
  const [autoAssignOpen, setAutoAssignOpen] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const templateOptions = [
    { label: "Select template...", value: "" },
    ...(templates?.map((t) => ({ label: `${t.name} (${t.code})`, value: t.code })) || []),
  ];

  // Get unique product types from Shopify products
  const productTypes = [...new Set(
    (products || []).map((p) => p.product_type).filter(Boolean)
  )] as string[];

  const [mappings, setMappings] = useState<Record<string, string>>({});

  const handleLink = async (productId: string, templateCode: string) => {
    if (!templateCode) return;
    setLinking(productId);
    try {
      await fetch(`/api/products/${productId}/metafields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateCode }),
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
        headers: { "Content-Type": "application/json" },
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

  const handleAutoAssign = async () => {
    const activeMappings = Object.entries(mappings)
      .filter(([, code]) => code)
      .map(([product_type, template_code]) => ({ product_type, template_code }));

    if (!activeMappings.length) {
      showToast("Select at least one mapping", { isError: true });
      return;
    }

    setAutoAssigning(true);
    try {
      const res = await fetch("/api/products/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: activeMappings }),
      });
      const json = await res.json();
      showToast(json.data?.message || "Products assigned");
      setAutoAssignOpen(false);
      refetch();
    } catch {
      showToast("Failed to auto-assign", { isError: true });
    } finally {
      setAutoAssigning(false);
    }
  };

  const linkedCount = (products || []).filter((p) => p.template_id).length;
  const totalCount = (products || []).length;

  const resourceName = { singular: "product", plural: "products" };

  return (
    <Page
      title="Link Products"
      subtitle="Connect Shopify products to MeasureRight templates"
      primaryAction={
        productTypes.length > 0
          ? { content: "Auto-Assign by Type", onAction: () => setAutoAssignOpen(true) }
          : undefined
      }
    >
      <BlockStack gap="400">
        {totalCount > 0 && (
          <Banner tone="info">
            <p>
              {linkedCount} of {totalCount} products linked.
              {linkedCount === 0 && " Use Auto-Assign to quickly link products by their product type, or link them individually below."}
            </p>
          </Banner>
        )}

        {!templates?.length && (
          <Banner tone="warning">
            <p>
              You need to create at least one product template before you can link
              products. Go to Templates to create one, or load demo data from the
              Dashboard.
            </p>
          </Banner>
        )}

        <Card padding="0">
          {isLoading ? (
            <div style={{ padding: "16px" }}>
              <SkeletonBodyText lines={5} />
            </div>
          ) : !products?.length ? (
            <EmptyState heading="No products found" image="">
              <p>No products found in your Shopify store. Create some products first, then come back to link them.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              headings={[
                { title: "Product" },
                { title: "Type" },
                { title: "Template" },
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
                  <IndexTable.Cell>
                    {product.product_type || <Text as="span" tone="subdued">None</Text>}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {product.template_id ? (
                      <Badge tone="success">
                        {templates?.find((t) => t.code === product.template_id || t.id === product.template_id)?.name || product.template_id}
                      </Badge>
                    ) : (
                      <div style={{ maxWidth: "200px" }}>
                        <Select
                          label=""
                          labelHidden
                          options={templateOptions}
                          value=""
                          onChange={(val) => handleLink(product.id, val)}
                          disabled={linking === product.id || !templates?.length}
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
      </BlockStack>

      {/* Auto-Assign Modal */}
      <Modal
        open={autoAssignOpen}
        onClose={() => setAutoAssignOpen(false)}
        title="Auto-Assign Templates by Product Type"
        primaryAction={{
          content: "Assign",
          onAction: handleAutoAssign,
          loading: autoAssigning,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setAutoAssignOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Map each Shopify product type to a MeasureRight template. All
              products of that type will be linked automatically.
            </Text>
            <FormLayout>
              {productTypes.map((type) => (
                <Select
                  key={type}
                  label={`"${type}" products`}
                  options={templateOptions}
                  value={mappings[type] || ""}
                  onChange={(val) => setMappings((prev) => ({ ...prev, [type]: val }))}
                />
              ))}
              {productTypes.length === 0 && (
                <Text as="p" tone="subdued">
                  No product types found. Set product types on your Shopify
                  products first (e.g. "Blinds", "Curtains").
                </Text>
              )}
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
