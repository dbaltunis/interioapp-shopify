import { useParams } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useApiGet, useApiUpdate } from "@/hooks/useApi";
import { toast } from "sonner";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";
import { useState, useEffect } from "react";

const STATUS_FLOW: WorkOrderStatus[] = ["pending", "in_production", "completed", "shipped"];

const STATUS_VARIANT: Record<WorkOrderStatus, "warning" | "info" | "success" | "default"> = {
  pending: "warning",
  in_production: "info",
  completed: "success",
  shipped: "default",
};

export default function OrderDetailPage() {
  const { id } = useParams();
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
      await updateMutation.mutateAsync({
        id: id!,
        status: nextStatus,
      } as { id: string } & Partial<WorkOrder>);
      toast.success(`Order moved to ${nextStatus.replace("_", " ")}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateMutation.mutateAsync({ id: id!, notes } as { id: string } & Partial<WorkOrder>);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  if (isLoading || !order) {
    return (
      <PageLayout title="Loading..." backTo="/orders">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Order: ${order.id.slice(0, 8)}...`} backTo="/orders">
      {/* Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Status</CardTitle>
            <div className="flex items-center gap-2">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <Badge
                    variant={i <= currentIdx ? STATUS_VARIANT[s] : "outline"}
                    className="capitalize"
                  >
                    {s.replace("_", " ")}
                  </Badge>
                  {i < STATUS_FLOW.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {nextStatus && (
            <Button onClick={handleAdvanceStatus}>
              Move to {nextStatus.replace("_", " ")}
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Production Items</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.template_name}</TableCell>
                  <TableCell>{item.width}mm</TableCell>
                  <TableCell>{item.drop}mm</TableCell>
                  <TableCell>
                    {item.fabric || "—"}
                    {item.colour && ` (${item.colour})`}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                </TableRow>
              ))}
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
            placeholder="Production notes..."
          />
          <Button variant="outline" size="sm" onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
