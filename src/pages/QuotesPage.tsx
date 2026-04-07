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
import type { Quote, QuoteStatus } from "@/lib/types";

const STATUS_TONE: Record<QuoteStatus, BadgeProps["tone"]> = {
  draft: undefined,
  sent: "info",
  accepted: "success",
  rejected: "critical",
};

export default function QuotesPage() {
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useApiList<Quote>("quotes");

  const resourceName = { singular: "quote", plural: "quotes" };

  return (
    <Page title="Quotes" subtitle="View and manage customer quotes">
      <Card padding="0">
        {isLoading ? (
          <div style={{ padding: "16px" }}>
            <SkeletonBodyText lines={5} />
          </div>
        ) : !quotes?.length ? (
          <EmptyState
            heading="No quotes yet"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>When customers use your calculator, their quotes will appear here.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={quotes.length}
            headings={[
              { title: "Customer" },
              { title: "Email" },
              { title: "Items" },
              { title: "Total" },
              { title: "Status" },
              { title: "Date" },
            ]}
            selectable={false}
          >
            {quotes.map((q, index) => (
              <IndexTable.Row
                id={q.id}
                key={q.id}
                position={index}
                onClick={() => navigate(`/quotes/${q.id}`)}
              >
                <IndexTable.Cell>
                  <span style={{ fontWeight: 600 }}>{q.customer_name}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>{q.customer_email || "—"}</IndexTable.Cell>
                <IndexTable.Cell>{q.line_items?.length || 0}</IndexTable.Cell>
                <IndexTable.Cell>${q.total_inc_tax?.toFixed(2)}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={STATUS_TONE[q.status]}>{q.status}</Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {new Date(q.created_at).toLocaleDateString()}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>
    </Page>
  );
}
