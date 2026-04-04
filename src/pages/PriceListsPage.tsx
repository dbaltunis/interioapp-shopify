import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  IndexTable,
  Button,
  SkeletonBodyText,
  EmptyState,
  InlineStack,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { useApiList, useApiDelete } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
import type { PricingGrid, ProductTemplate, Fabric } from "@/lib/types";

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
      showToast("Grid deleted");
    } catch {
      showToast("Failed to delete grid", { isError: true });
    }
  };

  const resourceName = { singular: "price list", plural: "price lists" };

  return (
    <Page
      title="Price Lists"
      subtitle="Manage pricing grids for your products"
      primaryAction={{ content: "Add Price List", onAction: () => navigate("/price-lists/new") }}
    >
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={3} />
          </div>
        ) : !grids?.length ? (
          <EmptyState
            heading="No pricing grids yet"
            action={{ content: "Create Price List", onAction: () => navigate("/price-lists/new") }}
            image=""
          >
            <p>Create your first pricing grid to set up product pricing.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={grids.length}
            headings={[
              { title: "Template" },
              { title: "Fabric" },
              { title: "Grid Size" },
              { title: "Price/sqm" },
              { title: "Price/lm" },
              { title: "Actions", alignment: "end" },
            ]}
            selectable={false}
          >
            {grids.map((g, index) => (
              <IndexTable.Row
                id={g.id}
                key={g.id}
                position={index}
                onClick={() => navigate(`/price-lists/${g.id}`)}
              >
                <IndexTable.Cell>
                  <span style={{ fontWeight: 600 }}>{getTemplateName(g.product_template_id)}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>{getFabricName(g.fabric_id)}</IndexTable.Cell>
                <IndexTable.Cell>
                  {g.width_bands?.length || 0} x {g.drop_bands?.length || 0}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {g.price_per_sqm != null ? `$${g.price_per_sqm}` : "—"}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {g.price_per_linear_metre != null ? `$${g.price_per_linear_metre}` : "—"}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <InlineStack gap="100" align="end">
                      <Button
                        icon={EditIcon}
                        variant="plain"
                        onClick={() => navigate(`/price-lists/${g.id}`)}
                        accessibilityLabel="Edit grid"
                      />
                      <Button
                        icon={DeleteIcon}
                        variant="plain"
                        tone="critical"
                        onClick={() => handleDelete(g.id)}
                        accessibilityLabel="Delete grid"
                      />
                    </InlineStack>
                  </div>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>
    </Page>
  );
}
