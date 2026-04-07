import { useState, useCallback } from "react";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  TextField,
  Button,
  Banner,
  Badge,
  Divider,
  SkeletonBodyText,
  Box,
  Icon,
} from "@shopify/polaris";
import {
  ConnectIcon,
  RefreshIcon,
  DeleteIcon,
  ImportIcon,
  ExportIcon,
  CheckSmallIcon,
} from "@shopify/polaris-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { showToast } from "@/lib/toast";

interface ConnectionStatus {
  connected: boolean;
  account_id: string;
  api_key_set: boolean;
  api_key_masked: string;
  last_sync: string | null;
}

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

interface FullSyncResult {
  fabrics: SyncResult;
  templates: SyncResult;
  synced_at: string;
}

export default function InterioAppPage() {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Connection status
  const { data: status, isLoading } = useQuery<ConnectionStatus>({
    queryKey: ["interioapp-status"],
    queryFn: async () => {
      const res = await fetch("/api/interioapp/status");
      const json = await res.json();
      return json.data;
    },
  });

  // Form state for connection
  const [accountId, setAccountId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showConnectForm, setShowConnectForm] = useState(false);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/interioapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId, api_key: apiKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interioapp-status"] });
      setShowConnectForm(false);
      setAccountId("");
      setApiKey("");
      showToast(
        `Connected! Found ${data.templates_count} templates and ${data.fabrics_count} fabrics.`
      );
    },
    onError: (err: Error) => {
      showToast(err.message, { isError: true });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/interioapp/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interioapp-status"] });
      showToast("Disconnected from InterioApp");
    },
    onError: () => {
      showToast("Failed to disconnect", { isError: true });
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/interioapp/test", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        showToast(`Connection OK — ${data.templates_count} templates, ${data.fabrics_count} fabrics`);
      } else {
        showToast(`Connection failed: ${data.error}`, { isError: true });
      }
    },
    onError: (err: Error) => {
      showToast(err.message, { isError: true });
    },
  });

  // Sync mutations
  const syncAllMutation = useMutation<FullSyncResult>({
    mutationFn: async () => {
      const res = await fetch("/api/interioapp/sync/all", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interioapp-status"] });
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      const f = data.fabrics;
      const t = data.templates;
      showToast(
        `Synced ${f.total} fabrics (${f.created} new, ${f.updated} updated) and ${t.total} templates (${t.created} new, ${t.updated} updated)`
      );
    },
    onError: (err: Error) => {
      showToast(err.message, { isError: true });
    },
  });

  const syncFabricsMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      const res = await fetch("/api/interioapp/sync/fabrics", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interioapp-status"] });
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      showToast(`Synced ${data.total} fabrics — ${data.created} created, ${data.updated} updated`);
    },
    onError: (err: Error) => {
      showToast(err.message, { isError: true });
    },
  });

  const syncTemplatesMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      const res = await fetch("/api/interioapp/sync/templates", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interioapp-status"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      showToast(
        `Synced ${data.total} templates — ${data.created} created, ${data.updated} updated`
      );
    },
    onError: (err: Error) => {
      showToast(err.message, { isError: true });
    },
  });

  const isSyncing =
    syncAllMutation.isPending ||
    syncFabricsMutation.isPending ||
    syncTemplatesMutation.isPending;

  const handleDisconnect = useCallback(() => {
    if (confirm("Disconnect from InterioApp? Your synced data will remain.")) {
      disconnectMutation.mutate();
    }
  }, [disconnectMutation]);

  if (isLoading) {
    return (
      <Page title="InterioApp Integration">
        <Card>
          <SkeletonBodyText lines={4} />
        </Card>
      </Page>
    );
  }

  const connected = status?.connected ?? false;

  return (
    <Page
      title="InterioApp Integration"
      subtitle="Connect your InterioApp account to sync fabrics, templates, and pricing"
      backAction={{ url: "/settings" }}
    >
      <BlockStack gap="400">
        {/* Connection Status */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Connection</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Link your InterioApp account to pull fabrics, templates, and pricing data
                </Text>
              </BlockStack>
              {connected ? (
                <Badge tone="success">Connected</Badge>
              ) : (
                <Badge>Not connected</Badge>
              )}
            </InlineStack>

            {connected && (
              <>
                <Divider />
                <InlineGrid columns={3} gap="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Account ID</Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {status?.account_id}
                    </Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">API Key</Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {status?.api_key_masked || "Not set"}
                    </Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Last Sync</Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {status?.last_sync
                        ? new Date(status.last_sync).toLocaleString()
                        : "Never"}
                    </Text>
                  </BlockStack>
                </InlineGrid>
                <InlineStack gap="200">
                  <Button
                    icon={RefreshIcon}
                    onClick={() => testMutation.mutate()}
                    loading={testMutation.isPending}
                  >
                    Test Connection
                  </Button>
                  <Button
                    icon={DeleteIcon}
                    tone="critical"
                    onClick={handleDisconnect}
                    loading={disconnectMutation.isPending}
                  >
                    Disconnect
                  </Button>
                </InlineStack>
              </>
            )}

            {!connected && !showConnectForm && (
              <Button
                icon={ConnectIcon}
                variant="primary"
                onClick={() => setShowConnectForm(true)}
              >
                Connect InterioApp
              </Button>
            )}

            {showConnectForm && !connected && (
              <>
                <Divider />
                <BlockStack gap="300">
                  <Text as="p" variant="bodySm">
                    Enter your InterioApp credentials. You can find these in your InterioApp
                    account under Settings &rarr; API Access.
                  </Text>
                  <InlineGrid columns={2} gap="400">
                    <TextField
                      label="Account ID"
                      value={accountId}
                      onChange={setAccountId}
                      autoComplete="off"
                      placeholder="e.g. acc_abc123"
                    />
                    <TextField
                      label="API Key"
                      value={apiKey}
                      onChange={setApiKey}
                      autoComplete="off"
                      type="password"
                      placeholder="Your storefront API key"
                    />
                  </InlineGrid>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      onClick={() => connectMutation.mutate()}
                      loading={connectMutation.isPending}
                      disabled={!accountId || !apiKey}
                    >
                      Connect
                    </Button>
                    <Button onClick={() => setShowConnectForm(false)}>Cancel</Button>
                  </InlineStack>
                </BlockStack>
              </>
            )}
          </BlockStack>
        </Card>

        {/* Sync Operations */}
        {connected && (
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Sync Data</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Pull the latest fabrics, templates, and pricing from InterioApp into
                  MeasureRight
                </Text>
              </BlockStack>

              <InlineGrid columns={3} gap="400">
                <Box
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  padding="400"
                >
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ImportIcon} />
                      <Text as="h3" variant="headingSm">Fabrics</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Pull fabric catalog including colours, pricing, and roll widths
                    </Text>
                    <Button
                      onClick={() => syncFabricsMutation.mutate()}
                      loading={syncFabricsMutation.isPending}
                      disabled={isSyncing}
                      fullWidth
                    >
                      Sync Fabrics
                    </Button>
                  </BlockStack>
                </Box>

                <Box
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  padding="400"
                >
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ImportIcon} />
                      <Text as="h3" variant="headingSm">Templates</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Pull treatment templates, dimension limits, and options
                    </Text>
                    <Button
                      onClick={() => syncTemplatesMutation.mutate()}
                      loading={syncTemplatesMutation.isPending}
                      disabled={isSyncing}
                      fullWidth
                    >
                      Sync Templates
                    </Button>
                  </BlockStack>
                </Box>

                <Box
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  padding="400"
                >
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={RefreshIcon} />
                      <Text as="h3" variant="headingSm">Full Sync</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Pull all fabrics and templates in one operation
                    </Text>
                    <Button
                      variant="primary"
                      onClick={() => syncAllMutation.mutate()}
                      loading={syncAllMutation.isPending}
                      disabled={isSyncing}
                      fullWidth
                    >
                      Sync Everything
                    </Button>
                  </BlockStack>
                </Box>
              </InlineGrid>

              {/* Last sync result */}
              {syncAllMutation.data && (
                <Banner tone="success" title="Sync complete">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm">
                      Fabrics: {syncAllMutation.data.fabrics.total} total
                      ({syncAllMutation.data.fabrics.created} created,{" "}
                      {syncAllMutation.data.fabrics.updated} updated)
                    </Text>
                    <Text as="p" variant="bodySm">
                      Templates: {syncAllMutation.data.templates.total} total
                      ({syncAllMutation.data.templates.created} created,{" "}
                      {syncAllMutation.data.templates.updated} updated)
                    </Text>
                  </BlockStack>
                </Banner>
              )}
            </BlockStack>
          </Card>
        )}

        {/* Push Operations */}
        {connected && (
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Push to InterioApp</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Send quotes and leads from MeasureRight back to InterioApp
                </Text>
              </BlockStack>

              <InlineGrid columns={2} gap="400">
                <Box
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  padding="400"
                >
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ExportIcon} />
                      <Text as="h3" variant="headingSm">Quotes → Projects</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      When a quote is accepted, it can be pushed to InterioApp as a project
                      for production tracking. This happens automatically from the Quote
                      Detail page.
                    </Text>
                  </BlockStack>
                </Box>

                <Box
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  padding="400"
                >
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ExportIcon} />
                      <Text as="h3" variant="headingSm">Leads</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Customer inquiries from the storefront calculator are automatically
                      sent to InterioApp as leads when the integration is active.
                    </Text>
                  </BlockStack>
                </Box>
              </InlineGrid>
            </BlockStack>
          </Card>
        )}

        {/* How it works */}
        {!connected && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">How it works</Text>
              <BlockStack gap="300">
                {[
                  "Connect your InterioApp account with your Account ID and API key",
                  "Sync fabrics, templates, and pricing data from InterioApp into MeasureRight",
                  "Your storefront calculator automatically uses the synced pricing data",
                  "Quotes accepted in Shopify are pushed back to InterioApp as projects",
                  "Customer leads from the calculator widget are synced to InterioApp",
                ].map((step, i) => (
                  <InlineStack key={i} gap="300" blockAlign="start">
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "var(--p-color-bg-fill-emphasis)",
                        color: "var(--p-color-text-inverse)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <Text as="p" variant="bodyMd">{step}</Text>
                  </InlineStack>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
