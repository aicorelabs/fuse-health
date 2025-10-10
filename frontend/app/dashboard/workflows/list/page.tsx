"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    Archive,
    CheckCircle,
    Clock,
    Edit,
    Eye,
    FileText,
    Filter,
    MoreVertical,
    Pause,
    Play,
    Plus,
    Search,
    Trash2,
    Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    useArchiveWorkflow,
    useDeleteWorkflow,
    useExecuteWorkflow,
    usePauseWorkflow,
    usePublishWorkflow,
    useWorkflows,
} from "@/lib/api/workflow-queries";
import type { Workflow, WorkflowStatus } from "@/lib/api/workflows";

const statusConfig: Record<
    WorkflowStatus,
    { label: string; className: string; icon: typeof CheckCircle }
> = {
    PUBLISHED: {
        label: "Published",
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
        icon: CheckCircle,
    },
    DRAFT: {
        label: "Draft",
        className: "bg-slate-500/20 text-slate-300 border-slate-500/20",
        icon: FileText,
    },
    PAUSED: {
        label: "Paused",
        className: "bg-amber-500/15 text-amber-200 border-amber-500/20",
        icon: Pause,
    },
    ARCHIVED: {
        label: "Archived",
        className: "bg-gray-500/15 text-gray-300 border-gray-500/20",
        icon: Archive,
    },
};

export default function WorkflowsListPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "ALL">(
        "ALL",
    );

    // TODO: Get actual user ID from auth context
    const userId = "user_demo_001";

    const { data: workflows, isLoading } = useWorkflows({
        user_id: userId,
        status: statusFilter === "ALL" ? undefined : statusFilter,
    });

    const deleteWorkflow = useDeleteWorkflow();
    const publishWorkflow = usePublishWorkflow();
    const pauseWorkflow = usePauseWorkflow();
    const archiveWorkflow = useArchiveWorkflow();
    const executeWorkflow = useExecuteWorkflow();

    const filteredWorkflows =
        workflows?.filter((workflow) =>
            workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            workflow.description?.toLowerCase().includes(
                searchQuery.toLowerCase(),
            )
        ) || [];

    const handleExecute = async (workflowId: string) => {
        try {
            await executeWorkflow.mutateAsync({
                workflowId,
                payload: {
                    trigger_data: {
                        source: "manual",
                        timestamp: new Date().toISOString(),
                    },
                },
            });
            alert("Workflow executed successfully!");
        } catch (error) {
            alert("Failed to execute workflow");
            console.error(error);
        }
    };

    const handlePublish = async (workflowId: string) => {
        try {
            await publishWorkflow.mutateAsync(workflowId);
        } catch (error) {
            alert("Failed to publish workflow");
            console.error(error);
        }
    };

    const handlePause = async (workflowId: string) => {
        try {
            await pauseWorkflow.mutateAsync(workflowId);
        } catch (error) {
            alert("Failed to pause workflow");
            console.error(error);
        }
    };

    const handleArchive = async (workflowId: string) => {
        if (!confirm("Are you sure you want to archive this workflow?")) return;
        try {
            await archiveWorkflow.mutateAsync(workflowId);
        } catch (error) {
            alert("Failed to archive workflow");
            console.error(error);
        }
    };

    const handleDelete = async (workflowId: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this workflow? This action cannot be undone.",
            )
        ) return;
        try {
            await deleteWorkflow.mutateAsync(workflowId);
        } catch (error) {
            alert("Failed to delete workflow");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0B14] text-white">
            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Workflows
                        </h1>
                        <p className="mt-2 text-sm text-white/60">
                            Manage and monitor your automation workflows
                        </p>
                    </div>
                    <Link href="/dashboard/workflows">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Workflow
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card className="mb-6 border-white/10 bg-[#101322]">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input
                                    placeholder="Search workflows..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={statusFilter === "ALL"
                                        ? "default"
                                        : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("ALL")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={statusFilter === "PUBLISHED"
                                        ? "default"
                                        : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("PUBLISHED")}
                                >
                                    Published
                                </Button>
                                <Button
                                    variant={statusFilter === "DRAFT"
                                        ? "default"
                                        : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("DRAFT")}
                                >
                                    Draft
                                </Button>
                                <Button
                                    variant={statusFilter === "PAUSED"
                                        ? "default"
                                        : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("PAUSED")}
                                >
                                    Paused
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Workflows Grid */}
                {isLoading
                    ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-white/60">
                                Loading workflows...
                            </div>
                        </div>
                    )
                    : filteredWorkflows.length === 0
                    ? (
                        <Card className="border-white/10 bg-[#101322]">
                            <CardContent className="flex h-64 flex-col items-center justify-center gap-4">
                                <Zap className="h-12 w-12 text-white/20" />
                                <div className="text-center">
                                    <p className="text-lg font-semibold">
                                        No workflows found
                                    </p>
                                    <p className="mt-1 text-sm text-white/60">
                                        {searchQuery
                                            ? "Try adjusting your search"
                                            : "Create your first workflow to get started"}
                                    </p>
                                </div>
                                {!searchQuery && (
                                    <Link href="/dashboard/workflows">
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create Workflow
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )
                    : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredWorkflows.map((workflow) => {
                                const statusInfo =
                                    statusConfig[workflow.status];
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <Card
                                        key={workflow.id}
                                        className="border-white/10 bg-[#101322] transition-all hover:border-white/20"
                                    >
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-base truncate">
                                                        {workflow.name}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1 line-clamp-2">
                                                        {workflow.description ||
                                                            "No description"}
                                                    </CardDescription>
                                                </div>
                                                <Badge
                                                    className={statusInfo
                                                        .className +
                                                        " ml-2 shrink-0"}
                                                >
                                                    <StatusIcon className="mr-1 h-3 w-3" />
                                                    {statusInfo.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Metadata */}
                                            <div className="flex items-center gap-4 text-xs text-white/50">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {workflow.nodes.length}{" "}
                                                    nodes
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Zap className="h-3 w-3" />
                                                    {workflow.edges.length}{" "}
                                                    connections
                                                </div>
                                                {workflow.category && (
                                                    <Badge className="border-white/20 bg-white/5 text-xs">
                                                        {workflow.category}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Timestamps */}
                                            <div className="space-y-1 text-xs text-white/40">
                                                <div>
                                                    Created: {new Date(
                                                        workflow.created_at,
                                                    ).toLocaleDateString()}
                                                </div>
                                                {workflow.published_at && (
                                                    <div>
                                                        Published: {new Date(
                                                            workflow
                                                                .published_at,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                {workflow.status ===
                                                        "PUBLISHED" && (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 gap-1"
                                                        onClick={() =>
                                                            handleExecute(
                                                                workflow.id,
                                                            )}
                                                        disabled={executeWorkflow
                                                            .isPending}
                                                    >
                                                        <Play className="h-3 w-3" />
                                                        Execute
                                                    </Button>
                                                )}

                                                {workflow.status === "DRAFT" &&
                                                    (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 gap-1"
                                                            onClick={() =>
                                                                handlePublish(
                                                                    workflow.id,
                                                                )}
                                                            disabled={publishWorkflow
                                                                .isPending}
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                            Publish
                                                        </Button>
                                                    )}

                                                {workflow.status ===
                                                        "PUBLISHED" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handlePause(
                                                                workflow.id,
                                                            )}
                                                        disabled={pauseWorkflow
                                                            .isPending}
                                                    >
                                                        <Pause className="h-3 w-3" />
                                                    </Button>
                                                )}

                                                <Link
                                                    href={`/dashboard/workflows/${workflow.id}`}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                </Link>

                                                <Link
                                                    href={`/dashboard/workflows?id=${workflow.id}`}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </Link>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleArchive(
                                                            workflow.id,
                                                        )}
                                                    disabled={archiveWorkflow
                                                        .isPending}
                                                >
                                                    <Archive className="h-3 w-3" />
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-400 hover:text-red-300"
                                                    onClick={() =>
                                                        handleDelete(
                                                            workflow.id,
                                                        )}
                                                    disabled={deleteWorkflow
                                                        .isPending}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
            </div>
        </div>
    );
}
