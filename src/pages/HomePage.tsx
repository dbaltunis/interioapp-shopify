import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiList } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ProductTemplate, Quote, WorkOrder, AnalyticsData } from "@/lib/types";
import { CheckCircle2, Circle, LayoutTemplate, FileText, Package } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: templates, isLoading: loadingTemplates } = useApiList<ProductTemplate>("templates");
  const { data: quotes, isLoading: loadingQuotes } = useApiList<Quote>("quotes");
  const { data: orders, isLoading: loadingOrders } = useApiList<WorkOrder>("work-orders");

  const hasTemplates = (templates?.length ?? 0) > 0;
  const hasQuotes = (quotes?.length ?? 0) > 0;
  const hasOrders = (orders?.length ?? 0) > 0;

  const checklist = [
    { label: "Create your first product template", done: hasTemplates, path: "/templates/new" },
    { label: "Set up a pricing grid", done: false, path: "/price-lists/new" },
    { label: "Link a Shopify product", done: false, path: "/shopify-products" },
    { label: "Preview the calculator on your store", done: false, path: null },
  ];

  const isLoading = loadingTemplates || loadingQuotes || loadingOrders;

  return (
    <PageLayout title="Dashboard" description="Welcome to MeasureRight">
      {/* Onboarding Checklist */}
      {!hasTemplates && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={item.done ? "line-through text-muted-foreground" : ""}>
                    {item.label}
                  </span>
                  {!item.done && item.path && (
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-auto"
                      onClick={() => navigate(item.path!)}
                    >
                      Start
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{templates?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{quotes?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{orders?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      {hasQuotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quotes?.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded"
                  onClick={() => navigate(`/quotes/${q.id}`)}
                >
                  <div>
                    <p className="font-medium">{q.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{q.customer_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${q.total?.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{q.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
