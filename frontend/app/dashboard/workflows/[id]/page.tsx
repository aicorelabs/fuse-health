"use client";

import { use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    AlertCircle,
    Archive,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    FileText,
    MoreHorizontal,
    Pause,
    Play,
    Trash2,
    XCircle,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    useArchiveWorkflow,
    useDeleteWorkflow,
    useExecuteWorkflow,
    usePauseWorkflow,
    usePublishWorkflow,
    useWorkflow,
    useWorkflowExecutions,
} from "@/lib/api/workflow-queries";
import type { ExecutionStatus, WorkflowStatus } from "@/lib/api/workflows";

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

const executionStatusConfig: Record<
    ExecutionStatus,
    { label: string; className: string; icon: typeof CheckCircle }
> = {
    SUCCESS: {
        label: "Success",
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
        icon: CheckCircle,
    },
    ERROR: {
        label: "Error",
        className: "bg-red-500/15 text-red-300 border-red-500/20",
        icon: XCircle,
    },
    RUNNING: {
        label: "Running",
        className: "bg-blue-500/15 text-blue-300 border-blue-500/20",
        icon: Clock,
    },
    QUEUED: {
        label: "Queued",
        className: "bg-slate-500/15 text-slate-300 border-slate-500/20",
        icon: Clock,
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-gray-500/15 text-gray-300 border-gray-500/20",
        icon: XCircle,
    },
    PARTIAL: {
        label: "Partial",
        className: "bg-amber-500/15 text-amber-300 border-amber-500/20",
        icon: AlertCircle,
    },
};

export default function WorkflowDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const { data: workflow, isLoading } = useWorkflow(id);
    const { data: executions, isLoading: executionsLoading } =
        useWorkflowExecutions(id, { take: 20 });

    const executeWorkflow = useExecuteWorkflow();
    const publishWorkflow = usePublishWorkflow();
    const pauseWorkflow = usePauseWorkflow();
    const archiveWorkflow = useArchiveWorkflow();
    const deleteWorkflow = useDeleteWorkflow();

    const handleExecute = async () => {
        try {
            await executeWorkflow.mutateAsync({
                workflowId: id,
                payload: {
                    trigger_data: {
                        source: "manual",
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        } catch (error) {
            alert("Failed to execute workflow");
            console.error(error);
        }
    };

    const handlePublish = async () => {
        try {
            await publishWorkflow.mutateAsync(id);
        } catch (error) {
            alert("Failed to publish workflow");
            console.error(error);
        }
    };

    const handlePause = async () => {
        try {
            await pauseWorkflow.mutateAsync(id);
        } catch (error) {
            alert("Failed to pause workflow");
            console.error(error);
        }
    };

    const handleArchive = async () => {
        if (!confirm("Are you sure you want to archive this workflow?")) return;
        try {
            await archiveWorkflow.mutateAsync(id);
        } catch (error) {
            alert("Failed to archive workflow");
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (
            !confirm(
                "Are you sure you want to delete this workflow? This action cannot be undone.",
            )
        ) return;
        try {
            await deleteWorkflow.mutateAsync(id);
            router.push("/dashboard/workflows/list");
        } catch (error) {
            alert("Failed to delete workflow");
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0B14] text-white">
                <div className="text-white/60">Loading workflow...</div>
            </div>
        );
    }

    if (!workflow) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0B14] text-white">
                <div className="text-white/60">Workflow not found</div>
            </div>
        );
    }

    const statusInfo = statusConfig[workflow.status];
    const StatusIcon = statusInfo.icon;

    return (
        <div className="min-h-screen bg-[#0A0B14] text-white">
            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard/workflows/list">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-4 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Workflows
                        </Button>
                    </Link>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {workflow.name}
                            </h1>
                            <p className="mt-2 text-sm text-white/60">
                                {workflow.description || "No description"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={statusInfo.className}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusInfo.label}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <Card className="mb-6 border-white/10 bg-[#101322]">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2">
                            {workflow.status === "PUBLISHED" && (
                                <Button
                                    className="gap-2"
                                    onClick={handleExecute}
                                    disabled={executeWorkflow.isPending}
                                >
                                    <Play className="h-4 w-4" />
                                    Execute Now
                                </Button>
                            )}
                            {workflow.status === "DRAFT" && (
                                <Button
                                    className="gap-2"
                                    onClick={handlePublish}
                                    disabled={publishWorkflow.isPending}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Publish
                                </Button>
                            )}
                            {workflow.status === "PUBLISHED" && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={handlePause}
                                    disabled={pauseWorkflow.isPending}
                                >
                                    <Pause className="h-4 w-4" />
                                    Pause
                                </Button>
                            )}
                            <Link
                                href={`/dashboard/workflows?id=${workflow.id}`}
                            >
                                <Button variant="outline" className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleArchive}
                                disabled={archiveWorkflow.isPending}
                            >
                                <Archive className="h-4 w-4" />
                                Archive
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 text-red-400 hover:text-red-300"
                                onClick={handleDelete}
                                disabled={deleteWorkflow.isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Workflow Info */}
                    <div className="lg:col-span-1">
                        <Card className="border-white/10 bg-[#101322]">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Workflow Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                        Nodes
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <FileText className="h-4 w-4 text-white/40" />
                                        {workflow.nodes.length} nodes
                                    </div>
                                </div>
                                <Separator className="bg-white/10" />
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                        Connections
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <Zap className="h-4 w-4 text-white/40" />
                                        {workflow.edges.length} connections
                                    </div>
                                </div>
                                {workflow.category && (
                                    <>
                                        <Separator className="bg-white/10" />
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                                Category
                                            </div>
                                            <Badge className="mt-1 border-white/20 bg-white/5">
                                                {workflow.category}
                                            </Badge>
                                        </div>
                                    </>
                                )}
                                <Separator className="bg-white/10" />
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                        Created
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-white/40" />
                                        {new Date(workflow.created_at)
                                            .toLocaleString()}
                                    </div>
                                </div>
                                <Separator className="bg-white/10" />
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                        Last Updated
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-white/40" />
                                        {new Date(workflow.updated_at)
                                            .toLocaleString()}
                                    </div>
                                </div>
                                {workflow.published_at && (
                                    <>
                                        <Separator className="bg-white/10" />
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                                Published
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-white/40" />
                                                {new Date(workflow.published_at)
                                                    .toLocaleString()}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Execution History */}
                    <div className="lg:col-span-2">
                        <Card className="border-white/10 bg-[#101322]">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Execution History
                                </CardTitle>
                                <CardDescription>
                                    Recent workflow executions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {executionsLoading
                                    ? (
                                        <div className="flex h-32 items-center justify-center text-white/60">
                                            Loading executions...
                                        </div>
                                    )
                                    : !executions || executions.length === 0
                                    ? (
                                        <div className="flex h-32 flex-col items-center justify-center gap-2 text-white/60">
                                            <Clock className="h-8 w-8 text-white/20" />
                                            <p>No executions yet</p>
                                        </div>
                                    )
                                    : (
                                        <div className="space-y-3">
                                            {executions.map((execution) => {
                                                const execStatusInfo =
                                                    executionStatusConfig[
                                                        execution.status
                                                    ];
                                                const ExecStatusIcon =
                                                    execStatusInfo.icon;
                                                const duration =
                                                    execution.completed_at
                                                        ? new Date(
                                                            execution
                                                                .completed_at,
                                                        ).getTime() -
                                                            new Date(
                                                                execution
                                                                    .started_at,
                                                            ).getTime()
                                                        : null;

                                                return (
                                                    <Link
                                                        key={execution.id}
                                                        href={`/dashboard/workflows/executions/${execution.id}`}
                                                        className="block"
                                                    >
                                                        <div className="rounded-lg border border-white/10 bg-[#0C0F1C] p-4 transition-all hover:border-white/20 hover:bg-[#121527]">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            className={execStatusInfo
                                                                                .className}
                                                                        >
                                                                            <ExecStatusIcon className="mr-1 h-3 w-3" />
                                                                            {execStatusInfo
                                                                                .label}
                                                                        </Badge>
                                                                        {duration !==
                                                                                null &&
                                                                            (
                                                                                <span className="text-xs text-white/40">
                                                                                    {duration}ms
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-white/60">
                                                                        Started:
                                                                        {" "}
                                                                        {new Date(
                                                                            execution
                                                                                .started_at,
                                                                        ).toLocaleString()}
                                                                    </div>
                                                                    {execution
                                                                        .completed_at &&
                                                                        (
                                                                            <div className="text-xs text-white/40">
                                                                                Completed:
                                                                                {" "}
                                                                                {new Date(
                                                                                    execution
                                                                                        .completed_at,
                                                                                ).toLocaleString()}
                                                                            </div>
                                                                        )}
                                                                    {execution
                                                                        .error &&
                                                                        (
                                                                            <div className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-300">
                                                                                {execution
                                                                                    .error}
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
