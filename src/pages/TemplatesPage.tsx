import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  IndexTable,
  Badge,
  Button,
  SkeletonBodyText,
  EmptyState,
  InlineStack,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { useApiList, useApiDelete } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
import type { ProductTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useApiList<ProductTemplate>("templates");
  const deleteMutation = useApiDelete("templates");

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(`Template "${name}" deleted`);
    } catch {
      showToast("Failed to delete template", { isError: true });
    }
  };

  const resourceName = { singular: "template", plural: "templates" };

  return (
    <Page
      title="Product Templates"
      subtitle="Manage your made-to-measure product configurations"
      primaryAction={{ content: "Add Template", onAction: () => navigate("/templates/new") }}
    >
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={5} />
          </div>
        ) : !templates?.length ? (
          <EmptyState
            heading="No templates yet"
            action={{ content: "Create Template", onAction: () => navigate("/templates/new") }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Templates define how your made-to-measure products are configured and priced. Create your first template to start accepting custom orders.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={templates.length}
            headings={[
              { title: "Name" },
              { title: "Code" },
              { title: "Category" },
              { title: "Pricing Model" },
              { title: "Dimensions (mm)" },
              { title: "Actions", alignment: "end" },
            ]}
            selectable={false}
          >
            {templates.map((t, index) => (
              <IndexTable.Row
                id={t.id}
                key={t.id}
                position={index}
                onClick={() => navigate(`/templates/${t.id}`)}
              >
                <IndexTable.Cell>
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{t.code}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge>{t.category}</Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {t.pricing_model?.replace("_", " ")}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  W: {t.min_width}–{t.max_width} | D: {t.min_drop}–{t.max_drop}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <InlineStack gap="100" align="end">
                      <Button
                        icon={EditIcon}
                        variant="plain"
                        onClick={() => navigate(`/templates/${t.id}`)}
                        accessibilityLabel={`Edit ${t.name}`}
                      />
                      <Button
                        icon={DeleteIcon}
                        variant="plain"
                        tone="critical"
                        onClick={() => handleDelete(t.id, t.name)}
                        accessibilityLabel={`Delete ${t.name}`}
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
