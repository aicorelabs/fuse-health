"use client";

import { useState } from "react";
import {
    type ConnectorMetadata,
    type Integration,
    useConnectorCategories,
    useConnectors,
    useCreateIntegration,
    useDeleteIntegration,
    useIntegrations,
    useTestIntegration,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function IntegrationsPage() {
    const [selectedCategory, setSelectedCategory] = useState<
        string | undefined
    >();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<
        ConnectorMetadata | null
    >(null);

    // Fetch data
    const {
        data: integrations,
        isLoading: integrationsLoading,
        refetch: refetchIntegrations,
    } = useIntegrations({ category: selectedCategory });

    const { data: connectors, isLoading: connectorsLoading } = useConnectors();
    const { data: categories } = useConnectorCategories();

    // Mutations
    const createIntegration = useCreateIntegration();
    const deleteIntegration = useDeleteIntegration();
    const testIntegration = useTestIntegration();

    const handleCreateIntegration = (connector: ConnectorMetadata) => {
        setSelectedConnector(connector);
        setIsCreateDialogOpen(true);
    };

    const handleTestIntegration = async (integration: Integration) => {
        try {
            const result = await testIntegration.mutateAsync(integration.id);

            if (result.success) {
                alert(`✅ Test Successful: ${result.message}`);
            } else {
                alert(`❌ Test Failed: ${result.error || result.message}`);
            }
        } catch (error) {
            alert(
                `❌ Test Failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            );
        }
    };

    const handleDeleteIntegration = async (integration: Integration) => {
        if (
            !confirm(
                `Are you sure you want to delete "${integration.display_name}"?`,
            )
        ) {
            return;
        }

        try {
            await deleteIntegration.mutateAsync(integration.id);
            alert(
                `✅ Integration Deleted: ${integration.display_name} has been removed.`,
            );
        } catch (error) {
            alert(
                `❌ Delete Failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            );
        }
    };

    if (integrationsLoading || connectorsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary">
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Integrations</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Connect external services to power your workflows
                    </p>
                </div>
                <Button onClick={() => refetchIntegrations()}>
                    <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh
                </Button>
            </div>

            {/* Category Filter */}
            {categories && categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={selectedCategory === undefined
                            ? "default"
                            : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(undefined)}
                    >
                        All ({integrations?.length || 0})
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category.name}
                            variant={selectedCategory === category.name
                                ? "default"
                                : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.name)}
                        >
                            {category.name} ({category.connector_count})
                        </Button>
                    ))}
                </div>
            )}

            {/* My Integrations */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">My Integrations</h2>
                {integrations && integrations.length > 0
                    ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {integrations.map((integration) => (
                                <Card key={integration.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {integration.connector_metadata
                                                    ?.icon && (
                                                    <span className="text-2xl">
                                                        {integration
                                                            .connector_metadata
                                                            .icon}
                                                    </span>
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {integration
                                                            .display_name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {integration
                                                            .connector_metadata
                                                            ?.name ||
                                                            integration
                                                                .connector_id}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={integration.status ===
                                                        "ACTIVE"
                                                    ? "default"
                                                    : "secondary"}
                                            >
                                                {integration.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Category
                                            </span>
                                            <Badge variant="outline">
                                                {integration.category}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Auth
                                            </span>
                                            <span className="font-mono text-xs">
                                                {integration.auth_type}
                                            </span>
                                        </div>
                                        {integration.last_used_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Last Used
                                                </span>
                                                <span className="text-xs">
                                                    {new Date(
                                                        integration
                                                            .last_used_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() =>
                                                    handleTestIntegration(
                                                        integration,
                                                    )}
                                                disabled={testIntegration
                                                    .isPending}
                                            >
                                                {testIntegration.isPending
                                                    ? "Testing..."
                                                    : "✓ Test"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDeleteIntegration(
                                                        integration,
                                                    )}
                                                disabled={deleteIntegration
                                                    .isPending}
                                            >
                                                {deleteIntegration.isPending
                                                    ? "..."
                                                    : "🗑"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                    : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    No integrations yet
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                                    Add your first integration from the
                                    available connectors below
                                </p>
                            </CardContent>
                        </Card>
                    )}
            </div>

            {/* Available Connectors */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">
                    Available Connectors
                </h2>
                {connectors && connectors.length > 0
                    ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {connectors
                                .filter((c) =>
                                    !selectedCategory ||
                                    c.category === selectedCategory
                                )
                                .map((connector) => (
                                    <Card
                                        key={connector.id}
                                        className="hover:border-primary/50 transition-colors cursor-pointer"
                                        onClick={() =>
                                            handleCreateIntegration(connector)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start gap-3">
                                                <span className="text-3xl">
                                                    {connector.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg truncate">
                                                        {connector.name}
                                                    </CardTitle>
                                                    <CardDescription className="line-clamp-2">
                                                        {connector.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <Badge variant="outline">
                                                    {connector.category}
                                                </Badge>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {connector.action_count}
                                                    {" "}
                                                    actions
                                                </span>
                                            </div>
                                            {connector.requires_oauth && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Requires OAuth
                                                </Badge>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    )
                    : (
                        <Card>
                            <CardContent className="flex items-center justify-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">
                                    No connectors available
                                </p>
                            </CardContent>
                        </Card>
                    )}
            </div>

            {/* Create Integration Form - Simple Modal */}
            {isCreateDialogOpen && selectedConnector && (
                <div
                    style={{ backdropFilter: "blur(4px)", margin: 0 }}
                    className="fixed inset-0 top-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setIsCreateDialogOpen(false)}
                >
                    <Card
                        className="w-full max-w-md m-4 bg-black!"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">
                                    {selectedConnector.icon}
                                </span>
                                <div>
                                    <CardTitle>
                                        Add {selectedConnector.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedConnector.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="bg-black">
                            <CreateIntegrationForm
                                connector={selectedConnector}
                                onSuccess={() => {
                                    setIsCreateDialogOpen(false);
                                    setSelectedConnector(null);
                                    refetchIntegrations();
                                }}
                                onCancel={() => setIsCreateDialogOpen(false)}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Create Integration Form Component
function CreateIntegrationForm({
    connector,
    onSuccess,
    onCancel,
}: {
    connector: ConnectorMetadata;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const createIntegration = useCreateIntegration();
    const [displayName, setDisplayName] = useState(`My ${connector.name}`);
    const [apiKey, setApiKey] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (connector.requires_oauth) {
            alert("OAuth authentication is not yet implemented. Coming soon!");
            return;
        }

        try {
            await createIntegration.mutateAsync({
                connector_id: connector.id,
                display_name: displayName,
                credentials: {
                    api_key: apiKey,
                },
            });

            alert(
                `✅ Integration Created: ${displayName} has been added successfully.`,
            );
            onSuccess();
        } catch (error) {
            alert(
                `❌ Creation Failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 ">
            <div>
                <label className="block text-sm font-medium mb-1">
                    Display Name
                </label>
                <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={`My ${connector.name}`}
                    required
                />
            </div>

            {!connector.requires_oauth && (
                <div>
                    <label className="block text-sm font-medium mb-1">
                        API Key
                    </label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter API key..."
                        required
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Your credentials are encrypted and stored securely.
                    </p>
                </div>
            )}

            {connector.requires_oauth && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        This connector requires OAuth authentication. You'll be
                        redirected to authorize access.
                    </p>
                </div>
            )}

            <div className="flex gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={createIntegration.isPending}
                    className="flex-1"
                >
                    {createIntegration.isPending
                        ? "Creating..."
                        : (connector.requires_oauth ? "Authorize" : "Create")}
                </Button>
            </div>
        </form>
    );
}
