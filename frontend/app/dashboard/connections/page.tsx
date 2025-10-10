"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useConnectionsQuery, useServicesQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectionCard } from "./components/ConnectionCard";
import { AddConnectionModal } from "./components/AddConnectionModal";

export default function ConnectionsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

    // Fetch connections with optional status filter
    const {
        data: connections = [],
        isLoading: connectionsLoading,
        error: connectionsError,
        refetch: refetchConnections,
    } = useConnectionsQuery(
        selectedStatus ? { status: selectedStatus } : undefined,
    );

    // Fetch available services for the add connection modal
    const {
        data: services = [],
        isLoading: servicesLoading,
    } = useServicesQuery();

    const handleAddConnection = () => {
        setIsAddModalOpen(true);
    };

    const handleRefresh = () => {
        refetchConnections();
    };

    // Calculate connection statistics
    const activeConnections =
        connections.filter((c) => c.status === "active").length;
    const errorConnections =
        connections.filter((c) => c.status === "error").length;
    const totalConnections = connections.length;

    return (
        <div className="space-y-6 container mx-auto max-w-7xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Connections
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your service connections and authentication
                        credentials
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={connectionsLoading}
                        className="w-10 px-0"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                connectionsLoading ? "animate-spin" : ""
                            }`}
                        />
                    </Button>
                    <Button onClick={handleAddConnection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Connection
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Connections
                            </p>
                            <p className="text-2xl font-bold">
                                {totalConnections}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-6 w-6 text-primary"
                            >
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" x2="12" y1="2" y2="15" />
                            </svg>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Active
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {activeConnections}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-6 w-6 text-green-600"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Errors
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {errorConnections}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-6 w-6 text-red-600"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" x2="12" y1="8" y2="12" />
                                <line x1="12" x2="12.01" y1="16" y2="16" />
                            </svg>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={selectedStatus === undefined
                        ? "default"
                        : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(undefined)}
                >
                    All
                </Button>
                <Button
                    variant={selectedStatus === "active"
                        ? "default"
                        : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("active")}
                >
                    Active
                </Button>
                <Button
                    variant={selectedStatus === "error" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("error")}
                >
                    Errors
                </Button>
                <Button
                    variant={selectedStatus === "expired"
                        ? "default"
                        : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("expired")}
                >
                    Expired
                </Button>
            </div>

            {/* Connections List */}
            <div className="space-y-4">
                {connectionsLoading
                    ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )
                    : connectionsError
                    ? (
                        <Card className="p-6">
                            <div className="text-center text-red-600">
                                <p className="font-medium">
                                    Error loading connections
                                </p>
                                <p className="text-sm mt-1">
                                    {connectionsError.message}
                                </p>
                            </div>
                        </Card>
                    )
                    : connections.length === 0
                    ? (
                        <Card className="p-12">
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            className="h-8 w-8 text-muted-foreground"
                                        >
                                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                            <polyline points="16 6 12 2 8 6" />
                                            <line
                                                x1="12"
                                                x2="12"
                                                y1="2"
                                                y2="15"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">
                                        No connections yet
                                    </h3>
                                    <p className="text-muted-foreground mt-1">
                                        Get started by adding your first service
                                        connection
                                    </p>
                                </div>
                                <Button onClick={handleAddConnection}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Connection
                                </Button>
                            </div>
                        </Card>
                    )
                    : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {connections.map((connection) => (
                                <ConnectionCard
                                    key={connection.id}
                                    connection={connection}
                                />
                            ))}
                        </div>
                    )}
            </div>

            {/* Add Connection Modal */}
            <AddConnectionModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                services={services}
                servicesLoading={servicesLoading}
            />
        </div>
    );
}
