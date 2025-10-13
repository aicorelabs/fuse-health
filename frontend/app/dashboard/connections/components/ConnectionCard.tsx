"use client";

import { useState } from "react";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Edit,
    MoreVertical,
    RefreshCw,
    Trash2,
    XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    type Connection,
    useDeleteConnectionMutation,
    useTestConnectionMutation,
} from "@/lib/api";

interface ConnectionCardProps {
    connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const testMutation = useTestConnectionMutation();
    const deleteMutation = useDeleteConnectionMutation();

    const handleTest = () => {
        testMutation.mutate(connection.id, {
            onSuccess: (result) => {
                if (result.success) {
                    alert(`✓ Connection test successful: ${result.message}`);
                } else {
                    alert(`✗ Connection test failed: ${result.message}`);
                }
            },
            onError: (error) => {
                alert(`Error testing connection: ${error.message}`);
            },
        });
    };

    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete the connection "${connection.display_name}"?`,
            )
        ) {
            deleteMutation.mutate(connection.id, {
                onSuccess: () => {
                    alert("Connection deleted successfully");
                },
                onError: (error) => {
                    alert(`Error deleting connection: ${error.message}`);
                },
            });
        }
    };

    const getStatusIcon = () => {
        switch (connection.status) {
            case "active":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "error":
                return <XCircle className="h-4 w-4 text-red-600" />;
            case "expired":
                return <Clock className="h-4 w-4 text-orange-600" />;
            case "revoked":
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
            default:
                return null;
        }
    };

    const getStatusColor = () => {
        switch (connection.status) {
            case "active":
                return "bg-green-100 text-green-800 border-green-200";
            case "error":
                return "bg-red-100 text-red-800 border-red-200";
            case "expired":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "revoked":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const getAuthTypeLabel = (authType: string) => {
        const labels: Record<string, string> = {
            oauth2: "OAuth 2.0",
            api_key: "API Key",
            basic_auth: "Basic Auth",
            bearer_token: "Bearer Token",
            client_credentials: "Client Credentials",
        };
        return labels[authType] || authType;
    };

    return (
        <Card className="p-5 hover:shadow-lg transition-shadow relative">
            {/* Menu Button */}
            <div className="absolute top-4 right-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    onClick={() => setShowMenu(!showMenu)}
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
                {showMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                            onClick={() => {
                                handleTest();
                                setShowMenu(false);
                            }}
                            disabled={testMutation.isPending}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    testMutation.isPending ? "animate-spin" : ""
                                }`}
                            />
                            Test Connection
                        </button>
                        <button
                            onClick={() => {
                                // TODO: Open edit modal
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </button>
                        <hr className="my-1" />
                        <button
                            onClick={() => {
                                handleDelete();
                                setShowMenu(false);
                            }}
                            disabled={deleteMutation.isPending}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3 pr-8">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                            {connection.service_type.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                            {connection.display_name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                            {connection.service_type}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <Badge className={getStatusColor()}>
                        {connection.status}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {getAuthTypeLabel(connection.auth_type)}
                    </Badge>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{formatDate(connection.created_at)}</span>
                    </div>
                    {connection.last_tested_at && (
                        <div className="flex justify-between">
                            <span>Last tested:</span>
                            <span>{formatDate(connection.last_tested_at)}</span>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleTest}
                    disabled={testMutation.isPending}
                >
                    {testMutation.isPending
                        ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        )
                        : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Test Connection
                            </>
                        )}
                </Button>
            </div>
        </Card>
    );
}
