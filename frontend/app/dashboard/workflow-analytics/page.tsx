"use client";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    CheckCircle2,
    Clock,
    Download,
    GitBranch,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { useWorkflowAnalytics } from "@/lib/api/workflow-queries";
import { useEffect, useState } from "react";

type ChartTooltipItem = {
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
};

interface ChartTooltipProps {
    active?: boolean;
    payload?: ChartTooltipItem[];
    label?: string | number;
}

function AnalyticsTooltip(props: ChartTooltipProps) {
    const { active, payload, label } = props;

    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-white/10 bg-[#0F1526] px-3 py-2 text-xs text-white/80 shadow-xl">
            {label && <p className="mb-1 font-medium text-white">{label}</p>}
            <div className="space-y-1">
                {payload.map((item, index) => {
                    const color = item.color ?? "#ffffff";
                    const displayName = `${
                        item.name ?? item.dataKey ?? "value"
                    }`;
                    const displayValue = typeof item.value === "number"
                        ? item.value.toLocaleString()
                        : item.value;

                    return (
                        <p
                            key={`${item.dataKey}-${index}`}
                            className="flex items-center justify-between gap-4 capitalize"
                        >
                            <span
                                className="flex items-center gap-2"
                                style={{ color }}
                            >
                                <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                {displayName}
                            </span>
                            <span className="text-white/70">
                                {displayValue}
                            </span>
                        </p>
                    );
                })}
            </div>
        </div>
    );
}

const statusColors = {
    success: "#34d399",
    error: "#f97316",
    running: "#93c5fd",
    queued: "#facc15",
    cancelled: "#a855f7",
};

const categoryColors = [
    "#60a5fa",
    "#a855f7",
    "#f97316",
    "#34d399",
    "#facc15",
    "#93c5fd",
];

export default function WorkflowAnalyticsPage() {
    const [userId, setUserId] = useState<string>("user_demo_001");
    const [days, setDays] = useState<number>(7);

    const { data: analytics, isLoading, error } = useWorkflowAnalytics(
        userId,
        days,
    );

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-white/60">Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-red-400">
                    Error loading analytics: {error.message}
                </p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-white/60">No analytics data available</p>
            </div>
        );
    }

    const metrics = [
        {
            label: "Total workflows",
            value: analytics.overview.total_workflows.toString(),
            delta: `${analytics.overview.active_workflows} active`,
            icon: GitBranch,
            direction: "neutral" as const,
        },
        {
            label: "Total executions",
            value: analytics.overview.total_executions.toLocaleString(),
            delta: `Last ${days} days`,
            icon: Activity,
            direction: "neutral" as const,
        },
        {
            label: "Success rate",
            value: `${analytics.overview.success_rate}%`,
            delta: analytics.overview.success_rate >= 90
                ? "Excellent"
                : "Needs attention",
            icon: CheckCircle2,
            direction: analytics.overview.success_rate >= 90
                ? "up" as const
                : "down" as const,
        },
        {
            label: "Avg. execution time",
            value: `${analytics.overview.avg_execution_time.toFixed(1)}s`,
            delta: "Per workflow",
            icon: Clock,
            direction: "neutral" as const,
        },
    ];

    return (
        <div className="flex flex-col gap-10 py-6 px-8">
            <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-8">
                    <div className="flex items-center gap-3 text-xs text-white/50">
                        <Badge className="border-white/20 bg-white/5 px-4 py-1 text-white/60">
                            {days} day snapshot
                        </Badge>
                        <span className="flex items-center gap-2 text-white/40">
                            <Clock className="h-4 w-4" strokeWidth={1.4} />
                            {new Date(analytics.date_range.start)
                                .toLocaleDateString()} –{" "}
                            {new Date(analytics.date_range.end)
                                .toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-3xl font-semibold text-white md:text-4xl">
                        Workflow analytics dashboard
                    </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="border-white/20">
                        <Download className="mr-2 h-4 w-4" strokeWidth={1.6} />
                        Export report
                    </Button>
                    <Button className="bg-white text-[#0A0B14] hover:bg-white">
                        Compare periods
                    </Button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    const deltaColor = metric.direction === "down"
                        ? "text-rose-400/80"
                        : metric.direction === "up"
                        ? "text-emerald-400/80"
                        : "text-white/60";
                    return (
                        <Card key={metric.label} className="m-0">
                            <CardContent
                                className="flex flex-col gap-4"
                                style={{ margin: "0px" }}
                            >
                                <div className="flex items-center justify-between m-0">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white">
                                        {metric.label}
                                    </p>
                                    <span className="rounded-full border border-white/10 bg-white/5 p-2">
                                        <Icon
                                            className="h-4 w-4 text-white/70"
                                            strokeWidth={1.6}
                                        />
                                    </span>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-white">
                                        {metric.value}
                                    </p>
                                    <p className={`text-xs ${deltaColor}`}>
                                        {metric.delta}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <Card className="">
                    <CardHeader>
                        <CardTitle>Daily execution trend</CardTitle>
                        <CardDescription>
                            Daily workflow executions showing success and error
                            rates over time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-full pb-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={analytics.daily_executions}
                                margin={{ left: 0, right: 0, top: 10 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorSuccess"
                                        x1="0"
                                        x2="0"
                                        y1="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#34d399"
                                            stopOpacity={0.6}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#34d399"
                                            stopOpacity={0.05}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorError"
                                        x1="0"
                                        x2="0"
                                        y1="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#f97316"
                                            stopOpacity={0.6}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#f97316"
                                            stopOpacity={0.05}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    stroke="rgba(255,255,255,0.08)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="rgba(255,255,255,0.35)"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="rgba(255,255,255,0.35)"
                                />
                                <Tooltip
                                    content={<AnalyticsTooltip />}
                                    cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="success"
                                    name="Successful"
                                    stroke="#34d399"
                                    fill="url(#colorSuccess)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="error"
                                    name="Failed"
                                    stroke="#f97316"
                                    fill="url(#colorError)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="grid gap-6">
                    <Card className="">
                        <CardHeader>
                            <CardTitle>Status distribution</CardTitle>
                            <CardDescription>
                                Workflow execution statuses in the selected
                                period.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics
                                            .execution_status_distribution
                                            .filter((s: any) => s.count > 0)}
                                        dataKey="count"
                                        nameKey="status"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={4}
                                    >
                                        {analytics.execution_status_distribution
                                            .filter((s: any) => s.count > 0)
                                            .map((
                                                entry: any,
                                                index: number,
                                            ) => (
                                                <Cell
                                                    key={entry.status}
                                                    fill={categoryColors[
                                                        index %
                                                        categoryColors.length
                                                    ]}
                                                />
                                            ))}
                                    </Pie>
                                    <Tooltip content={<AnalyticsTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardHeader>
                            <CardTitle>Category mix</CardTitle>
                            <CardDescription>
                                Distribution of workflows by category.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.category_distribution}
                                        dataKey="count"
                                        nameKey="category"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={4}
                                    >
                                        {analytics.category_distribution.map((
                                            entry: any,
                                            index: number,
                                        ) => (
                                            <Cell
                                                key={entry.category}
                                                fill={categoryColors[
                                                    index %
                                                    categoryColors.length
                                                ]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<AnalyticsTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
                <Card className="">
                    <CardHeader>
                        <CardTitle>Top workflows</CardTitle>
                        <CardDescription>
                            Most frequently executed workflows in the period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={analytics.workflow_execution_counts.slice(
                                    0,
                                    5,
                                )}
                            >
                                <CartesianGrid
                                    stroke="rgba(255,255,255,0.08)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="workflow_name"
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="rgba(255,255,255,0.35)"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="rgba(255,255,255,0.35)"
                                />
                                <Tooltip
                                    content={<AnalyticsTooltip />}
                                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                />
                                <Bar
                                    dataKey="executions"
                                    fill="#60a5fa"
                                    radius={[8, 8, 0, 0]}
                                    name="Executions"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="">
                    <CardHeader>
                        <CardTitle>Recent executions</CardTitle>
                        <CardDescription>
                            Latest workflow execution history with status and
                            duration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {analytics.recent_executions.slice(0, 6).map(
                            (execution: any) => {
                                const StatusIcon =
                                    execution.status === "SUCCESS"
                                        ? CheckCircle2
                                        : execution.status === "ERROR"
                                        ? XCircle
                                        : Clock;

                                const statusColor =
                                    execution.status === "SUCCESS"
                                        ? "text-emerald-400"
                                        : execution.status === "ERROR"
                                        ? "text-rose-400"
                                        : execution.status === "RUNNING"
                                        ? "text-blue-400"
                                        : "text-white/60";

                                return (
                                    <div
                                        key={execution.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <StatusIcon
                                                className={`h-5 w-5 mt-0.5 ${statusColor}`}
                                                strokeWidth={1.6}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {execution.workflow_name}
                                                </p>
                                                <p className="text-xs text-white/55">
                                                    {new Date(
                                                        execution.started_at,
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-white/55">
                                            <p
                                                className={`text-sm font-semibold capitalize ${statusColor}`}
                                            >
                                                {execution.status.toLowerCase()}
                                            </p>
                                            <p>
                                                {execution.duration
                                                    ? `${
                                                        execution.duration
                                                            .toFixed(1)
                                                    }s`
                                                    : execution.status ===
                                                            "RUNNING"
                                                    ? "In progress"
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
