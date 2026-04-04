import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiGet, useApiUpdate } from "@/hooks/useApi";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { toast } from "sonner";
import type { Quote, QuoteStatus } from "@/lib/types";
import { useState, useEffect } from "react";

const STATUS_VARIANT: Record<QuoteStatus, "secondary" | "info" | "success" | "destructive"> = {
  draft: "secondary",
  sent: "info",
  accepted: "success",
  rejected: "destructive",
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
      await updateMutation.mutateAsync({
        id: id!,
        status: newStatus,
      } as { id: string } & Partial<Quote>);
      toast.success(`Quote marked as ${newStatus}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateMutation.mutateAsync({ id: id!, notes } as { id: string } & Partial<Quote>);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      await fetch("/api/work-orders", {
        method: "POST",
        body: JSON.stringify({ quote_id: id }),
      });
      toast.success("Work order created");
      navigate("/orders");
    } catch {
      toast.error("Failed to create work order");
    }
  };

  if (isLoading || !quote) {
    return (
      <PageLayout title="Loading..." backTo="/quotes">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Quote: ${quote.customer_name}`} backTo="/quotes">
      {/* Customer Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{quote.customer_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {quote.customer_email} {quote.customer_phone && `| ${quote.customer_phone}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[quote.status]} className="capitalize text-sm">
              {quote.status}
            </Badge>
            {NEXT_STATUSES[quote.status].map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => handleStatusChange(s)}>
                Mark {s}
              </Button>
            ))}
            {quote.status === "accepted" && (
              <Button size="sm" onClick={handleCreateWorkOrder}>
                Create Work Order
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Drop</TableHead>
                <TableHead>Fabric</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.items?.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.template_name}</TableCell>
                  <TableCell>{item.width}mm</TableCell>
                  <TableCell>{item.drop}mm</TableCell>
                  <TableCell>
                    {item.fabric || "—"}
                    {item.colour && ` (${item.colour})`}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unit_price?.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.line_total?.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={6} className="text-right font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${quote.total?.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add internal notes..."
          />
          <Button variant="outline" size="sm" onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
