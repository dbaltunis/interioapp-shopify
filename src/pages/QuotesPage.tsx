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
import type { Quote, QuoteStatus } from "@/lib/types";

const STATUS_VARIANT: Record<QuoteStatus, "secondary" | "info" | "success" | "destructive"> = {
  draft: "secondary",
  sent: "info",
  accepted: "success",
  rejected: "destructive",
};

export default function QuotesPage() {
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useApiList<Quote>("quotes");

  return (
    <PageLayout title="Quotes" description="View and manage customer quotes">
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !quotes?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              No quotes yet. Quotes will appear here when customers use the calculator.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/quotes/${q.id}`)}
                  >
                    <TableCell className="font-medium">{q.customer_name}</TableCell>
                    <TableCell>{q.customer_email || "—"}</TableCell>
                    <TableCell>{q.items?.length || 0}</TableCell>
                    <TableCell>${q.total?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[q.status]} className="capitalize">
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString()}
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
