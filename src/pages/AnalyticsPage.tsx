import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiList } from "@/hooks/useApi";
import type { Quote, WorkOrder, ProductTemplate } from "@/lib/types";
import { DollarSign, FileText, Package, LayoutTemplate } from "lucide-react";

export default function AnalyticsPage() {
  const { data: templates, isLoading: lt } = useApiList<ProductTemplate>("templates");
  const { data: quotes, isLoading: lq } = useApiList<Quote>("quotes");
  const { data: orders, isLoading: lo } = useApiList<WorkOrder>("work-orders");
  const isLoading = lt || lq || lo;

  const revenue = quotes
    ?.filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + (q.total || 0), 0) || 0;

  const quotesByStatus = quotes?.reduce(
    (acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const stats = [
    {
      title: "Total Templates",
      value: templates?.length ?? 0,
      icon: LayoutTemplate,
    },
    {
      title: "Total Quotes",
      value: quotes?.length ?? 0,
      icon: FileText,
    },
    {
      title: "Total Orders",
      value: orders?.length ?? 0,
      icon: Package,
    },
    {
      title: "Revenue (Accepted)",
      value: `$${revenue.toFixed(2)}`,
      icon: DollarSign,
    },
  ];

  return (
    <PageLayout title="Analytics" description="Overview of your business metrics">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quotes by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quotes by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {["draft", "sent", "accepted", "rejected"].map((status) => {
                const count = quotesByStatus[status] || 0;
                const total = quotes?.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
