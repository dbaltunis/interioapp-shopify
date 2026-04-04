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
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList } from "@/hooks/useApi";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";

const STATUS_VARIANT: Record<WorkOrderStatus, "warning" | "info" | "success" | "default"> = {
  pending: "warning",
  in_production: "info",
  completed: "success",
  shipped: "default",
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useApiList<WorkOrder>("work-orders");

  return (
    <PageLayout title="Work Orders" description="Manage production orders">
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !orders?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              No work orders yet. Create one from an accepted quote.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    <TableCell className="font-medium font-mono">
                      {o.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[o.status]} className="capitalize">
                        {o.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{o.items?.length || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
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
