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
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { showToast } from "@/lib/toast";
import type { Quote, QuoteStatus } from "@/lib/types";

const STATUS_TONE: Record<QuoteStatus, BadgeProps["tone"]> = {
  draft: undefined,
  sent: "info",
  accepted: "success",
  rejected: "critical",
};

const NEXT_STATUSES: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

export default function QuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quote, isLoading, refetch } = useApiGet<Quote>("quotes", id);
  const updateMutation = useApiUpdate<Quote>("quotes");
  const fetch = useAuthenticatedFetch();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (quote) setNotes(quote.notes || "");
  }, [quote]);

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    try {
      await updateMutation.mutateAsync({ id: id!, status: newStatus } as { id: string } & Partial<Quote>);
      showToast(`Quote marked as ${newStatus}`);
      refetch();
    } catch {
      showToast("Failed to update status", { isError: true });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateMutation.mutateAsync({ id: id!, notes } as { id: string } & Partial<Quote>);
      showToast("Notes saved");
    } catch {
      showToast("Failed to save notes", { isError: true });
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      await fetch("/api/work-orders", {
        method: "POST",
        body: JSON.stringify({ quote_id: id }),
      });
      showToast("Work order created");
      navigate("/orders");
    } catch {
      showToast("Failed to create work order", { isError: true });
    }
  };

  const [pushingToInterioApp, setPushingToInterioApp] = useState(false);

  const handlePushToInterioApp = async () => {
    setPushingToInterioApp(true);
    try {
      const res = await fetch("/api/interioapp/push/project", {
        method: "POST",
        body: JSON.stringify({ quote_id: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(`Pushed to InterioApp as project ${json.data.project_number}`);
      refetch();
    } catch (err: any) {
      showToast(err.message || "Failed to push to InterioApp", { isError: true });
    } finally {
      setPushingToInterioApp(false);
    }
  };

  if (isLoading || !quote) {
    return (
      <SkeletonPage title="Loading..." backAction>
        <Card><SkeletonBodyText lines={4} /></Card>
        <Card><SkeletonBodyText lines={6} /></Card>
      </SkeletonPage>
    );
  }

  const itemRows = quote.line_items?.map((item) => [
    item.template_name,
    `${item.width}mm`,
    `${item.drop}mm`,
    `${item.fabric || "—"}${item.colour ? ` (${item.colour})` : ""}`,
    String(item.quantity),
    `$${item.unit_price?.toFixed(2)}`,
    `$${item.line_total?.toFixed(2)}`,
  ]) || [];

  return (
    <Page
      title={`Quote: ${quote.customer_name}`}
      backAction={{ content: "Quotes", onAction: () => navigate("/quotes") }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">{quote.customer_name}</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {quote.customer_email} {quote.customer_phone && `| ${quote.customer_phone}`}
                </Text>
              </BlockStack>
              <InlineStack gap="200">
                <Badge tone={STATUS_TONE[quote.status]}>{quote.status}</Badge>
                {NEXT_STATUSES[quote.status].map((s) => (
                  <Button key={s} size="slim" onClick={() => handleStatusChange(s)}>
                    Mark {s}
                  </Button>
                ))}
                {quote.status === "accepted" && (
                  <>
                    <Button variant="primary" size="slim" onClick={handleCreateWorkOrder}>
                      Create Work Order
                    </Button>
                    <Button
                      size="slim"
                      onClick={handlePushToInterioApp}
                      loading={pushingToInterioApp}
                    >
                      Push to InterioApp
                    </Button>
                  </>
                )}
              </InlineStack>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Line Items</Text>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "numeric", "numeric", "numeric"]}
              headings={["Product", "Width", "Drop", "Fabric", "Qty", "Unit Price", "Total"]}
              rows={itemRows}
              totals={["", "", "", "", "", "Total", `$${quote.total_inc_tax?.toFixed(2)}`]}
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
              placeholder="Add internal notes..."
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
