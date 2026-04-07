import { Component, type ReactNode, type ErrorInfo } from "react";
import { Page, Card, BlockStack, Text, Button, Banner } from "@shopify/polaris";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MeasureRight Error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Page title="MeasureRight">
          <Card>
            <BlockStack gap="400">
              <Banner title="Something went wrong" tone="critical">
                <p>The app encountered an error. Please try refreshing the page.</p>
              </Banner>
              <Text as="p" variant="bodySm" tone="subdued">
                {this.state.error?.message || "Unknown error"}
              </Text>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </BlockStack>
          </Card>
        </Page>
      );
    }
    return this.props.children;
  }
}
