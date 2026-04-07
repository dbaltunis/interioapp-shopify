import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  IndexTable,
  Badge,
  SkeletonBodyText,
  EmptyState,
} from "@shopify/polaris";
import type { BadgeProps } from "@shopify/polaris";
import { useApiList } from "@/hooks/useApi";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";

const STATUS_TONE: Record<WorkOrderStatus, BadgeProps["tone"]> = {
  pending: "warning",
  in_production: "info",
  completed: "success",
  shipped: undefined,
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useApiList<WorkOrder>("work-orders");

  const resourceName = { singular: "work order", plural: "work orders" };

  return (
    <Page title="Work Orders" subtitle="Manage production orders">
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={5} />
          </div>
        ) : !orders?.length ? (
          <EmptyState
            heading="No work orders yet"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Work orders are created from accepted quotes.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={orders.length}
            headings={[
              { title: "Order" },
              { title: "Status" },
              { title: "Items" },
              { title: "Date" },
            ]}
            selectable={false}
          >
            {orders.map((o, index) => (
              <IndexTable.Row
                id={o.id}
                key={o.id}
                position={index}
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <IndexTable.Cell>
                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                    {o.id.slice(0, 8)}...
                  </span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={STATUS_TONE[o.status]}>
                    {o.status.replace("_", " ")}
                  </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>{o.items?.length || 0}</IndexTable.Cell>
                <IndexTable.Cell>
                  {new Date(o.created_at).toLocaleDateString()}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>
    </Page>
  );
}
