import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  DataTable,
  TextField,
  SkeletonPage,
  SkeletonBodyText,
} from "@shopify/polaris";
import type { BadgeProps } from "@shopify/polaris";
import { useApiGet, useApiUpdate } from "@/hooks/useApi";
import { showToast } from "@/lib/toast";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";

const STATUS_FLOW: WorkOrderStatus[] = ["pending", "in_production", "completed", "shipped"];

const STATUS_TONE: Record<WorkOrderStatus, BadgeProps["tone"]> = {
  pending: "warning",
  in_production: "info",
  completed: "success",
  shipped: undefined,
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, refetch } = useApiGet<WorkOrder>("work-orders", id);
  const updateMutation = useApiUpdate<WorkOrder>("work-orders");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) setNotes(order.notes || "");
  }, [order]);

  const currentIdx = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;
    try {
      await updateMutation.mutateAsync({ id: id!, status: nextStatus } as { id: string } & Partial<WorkOrder>);
      showToast(`Order moved to ${nextStatus.replace("_", " ")}`);
      refetch();
    } catch {
      showToast("Failed to update status", { isError: true });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateMutation.mutateAsync({ id: id!, notes } as { id: string } & Partial<WorkOrder>);
      showToast("Notes saved");
    } catch {
      showToast("Failed to save notes", { isError: true });
    }
  };

  if (isLoading || !order) {
    return (
      <SkeletonPage title="Loading..." backAction={{ content: "Orders", url: "/orders" }}>
        <Card><SkeletonBodyText lines={4} /></Card>
        <Card><SkeletonBodyText lines={6} /></Card>
      </SkeletonPage>
    );
  }

  const itemRows = order.items?.map((item) => [
    item.template_name,
    `${item.width}mm`,
    `${item.drop}mm`,
    `${item.fabric || "—"}${item.colour ? ` (${item.colour})` : ""}`,
    String(item.quantity),
  ]) || [];

  return (
    <Page
      title={`Order: ${order.id.slice(0, 8)}...`}
      backAction={{ content: "Orders", onAction: () => navigate("/orders") }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Status</Text>
                <InlineStack gap="200" blockAlign="center">
                  {STATUS_FLOW.map((s, i) => (
                    <InlineStack key={s} gap="100" blockAlign="center">
                      <Badge tone={i <= currentIdx ? STATUS_TONE[s] : undefined}>
                        {s.replace("_", " ")}
                      </Badge>
                      {i < STATUS_FLOW.length - 1 && (
                        <Text as="span" tone="subdued">→</Text>
                      )}
                    </InlineStack>
                  ))}
                </InlineStack>
              </BlockStack>
              {nextStatus && (
                <Button variant="primary" onClick={handleAdvanceStatus}>
                  Move to {nextStatus.replace("_", " ")}
                </Button>
              )}
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Production Items</Text>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "numeric"]}
              headings={["Product", "Width", "Drop", "Fabric", "Qty"]}
              rows={itemRows}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Notes</Text>
            <TextField
              label=""
              labelHidden
              value={notes}
              onChange={setNotes}
              multiline={4}
              placeholder="Production notes..."
              autoComplete="off"
            />
            <div>
              <Button onClick={handleSaveNotes}>Save Notes</Button>
            </div>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
