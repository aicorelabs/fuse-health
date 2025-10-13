"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectors, useIntegrations } from "@/lib/api";
import type { ConnectorAction, NodeTypeDefinition } from "@/lib/api/workflows";

interface ConnectorActionSelectorProps {
    nodeId: string;
    serviceType?: string; // e.g., "gmail", "epic", "pubmed"
    nodeDefinition?: NodeTypeDefinition; // Node type definition with actions
    currentSelection?: {
        connectorId?: string;
        actionId?: string;
        integrationId?: string;
    };
    onSelect: (data: {
        connectorId: string;
        actionId: string;
        integrationId: string;
        connectorName: string;
        actionName: string;
        integrationName: string;
    }) => void;
}

export function ConnectorActionSelector(props: ConnectorActionSelectorProps) {
    const {
        nodeId,
        serviceType,
        nodeDefinition,
        currentSelection,
        onSelect,
    } = props;

    const [selectedIntegrationId, setSelectedIntegrationId] = useState<
        string | null
    >(currentSelection?.integrationId || null);
    const [expandedIntegrationId, setExpandedIntegrationId] = useState<
        string | null
    >(currentSelection?.integrationId || null);

    const { data: connectors, isLoading: isLoadingConnectors } =
        useConnectors();
    const { data: integrations, isLoading: isLoadingIntegrations } =
        useIntegrations({});

    // Filter integrations based on serviceType if provided
    const filteredIntegrations = integrations?.filter((integration) => {
        if (!serviceType) return true;
        const connector = connectors?.find(
            (c) => c.id === integration.connector_id,
        );
        return connector?.id === serviceType;
    });

    // Get connector for expanded integration
    const expandedIntegration = filteredIntegrations?.find(
        (i) => i.id === expandedIntegrationId,
    );
    const expandedConnector = expandedIntegration
        ? connectors?.find((c) => c.id === expandedIntegration.connector_id)
        : undefined;

    // Use actions from nodeDefinition instead of fetching from API
    const actions = nodeDefinition?.actions || [];
    const isLoadingActions = false;

    const handleIntegrationClick = (integrationId: string) => {
        if (expandedIntegrationId === integrationId) {
            setExpandedIntegrationId(null);
        } else {
            setExpandedIntegrationId(integrationId);
        }
    };

    const handleActionSelect = (actionId: string, actionName: string) => {
        if (!expandedIntegration || !expandedConnector) return;

        setSelectedIntegrationId(expandedIntegration.id);
        onSelect({
            connectorId: expandedIntegration.connector_id,
            actionId,
            integrationId: expandedIntegration.id,
            connectorName: expandedConnector.name,
            actionName,
            integrationName: expandedIntegration.display_name,
        });
    };

    if (isLoadingConnectors || isLoadingIntegrations) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
        );
    }

    if (!filteredIntegrations || filteredIntegrations.length === 0) {
        return (
            <div className="rounded-lg border border-white/10 bg-[#0C0F1C] p-4 text-center">
                <p className="text-sm text-white/50">
                    No integrations found. {serviceType &&
                        `Create a ${serviceType} integration first.`}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {filteredIntegrations.map((integration) => {
                const connector = connectors?.find(
                    (c) => c.id === integration.connector_id,
                );
                const isExpanded = expandedIntegrationId === integration.id;
                const isSelected = currentSelection?.integrationId ===
                        integration.id &&
                    currentSelection?.actionId;

                return (
                    <div
                        key={integration.id}
                        className={cn(
                            "rounded-lg border transition-all",
                            isExpanded
                                ? "border-blue-500/40 bg-[#0C0F1C]"
                                : "border-white/10 bg-[#0C0F1C] hover:border-white/20",
                        )}
                    >
                        {/* Integration Header */}
                        <button
                            onClick={() =>
                                handleIntegrationClick(integration.id)}
                            className="flex w-full items-center justify-between p-3 text-left"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {connector?.icon && (
                                    <span className="text-xl flex-shrink-0">
                                        {connector.icon}
                                    </span>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {integration.display_name}
                                        </p>
                                        {isSelected && (
                                            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-white/50">
                                        {connector?.name ||
                                            integration.connector_id}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight
                                className={cn(
                                    "h-4 w-4 text-white/40 transition-transform flex-shrink-0",
                                    isExpanded && "rotate-90",
                                )}
                            />
                        </button>

                        {/* Actions List */}
                        {isExpanded && (
                            <div className="border-t border-white/10 p-3 space-y-2">
                                {isLoadingActions
                                    ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                                        </div>
                                    )
                                    : actions && actions.length > 0
                                    ? (
                                        <>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
                                                Available Actions
                                            </div>
                                            {actions.map((action) => {
                                                const isActionSelected =
                                                    currentSelection
                                                            ?.actionId ===
                                                        action.id &&
                                                    currentSelection
                                                            ?.integrationId ===
                                                        integration.id;

                                                return (
                                                    <button
                                                        key={action.id}
                                                        onClick={() =>
                                                            handleActionSelect(
                                                                action.id,
                                                                action.name,
                                                            )}
                                                        className={cn(
                                                            "w-full rounded-lg border p-3 text-left transition-all",
                                                            isActionSelected
                                                                ? "border-emerald-500/40 bg-emerald-500/10"
                                                                : "border-white/10 bg-[#0A0B14] hover:border-white/20 hover:bg-[#0F1324]",
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-white">
                                                                        {action
                                                                            .name}
                                                                    </p>
                                                                    {isActionSelected &&
                                                                        (
                                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                                                        )}
                                                                </div>
                                                                <p className="mt-1 text-xs text-white/50">
                                                                    {action
                                                                        .description}
                                                                </p>
                                                                {action
                                                                    .params &&
                                                                    action
                                                                            .params
                                                                            .length >
                                                                        0 &&
                                                                    (
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {action
                                                                                .params
                                                                                .slice(
                                                                                    0,
                                                                                    3,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        param,
                                                                                    ) => (
                                                                                        <Badge
                                                                                            key={param
                                                                                                .name}
                                                                                            className="h-5 text-[10px] bg-white/5 border border-white/10"
                                                                                        >
                                                                                            {param
                                                                                                .name}
                                                                                            {param
                                                                                                .required &&
                                                                                                (
                                                                                                    <span className="ml-0.5 text-rose-300">
                                                                                                        *
                                                                                                    </span>
                                                                                                )}
                                                                                        </Badge>
                                                                                    ),
                                                                                )}
                                                                            {action
                                                                                        .params
                                                                                        .length >
                                                                                    3 &&
                                                                                (
                                                                                    <Badge className="h-5 text-[10px] bg-white/5 border border-white/10">
                                                                                        +
                                                                                        {action
                                                                                            .params
                                                                                            .length -
                                                                                            3}
                                                                                        {" "}
                                                                                        more
                                                                                    </Badge>
                                                                                )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )
                                    : (
                                        <p className="text-sm text-white/50 text-center py-2">
                                            No actions available
                                        </p>
                                    )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
