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
  AlertTriangle,
  CalendarRange,
  Download,
  Gauge,
  Layers3,
  TrendingUp,
} from "lucide-react";
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

const volumeData = [
  { day: "Mon", messages: 3180, completions: 1740 },
  { day: "Tue", messages: 4120, completions: 2050 },
  { day: "Wed", messages: 3890, completions: 1980 },
  { day: "Thu", messages: 4410, completions: 2210 },
  { day: "Fri", messages: 4730, completions: 2380 },
  { day: "Sat", messages: 3020, completions: 1590 },
  { day: "Sun", messages: 2840, completions: 1460 },
];

const latencyData = [
  { hour: "09:00", latency: 812 },
  { hour: "12:00", latency: 755 },
  { hour: "15:00", latency: 702 },
  { hour: "18:00", latency: 688 },
  { hour: "21:00", latency: 731 },
  { hour: "24:00", latency: 694 },
];

const sentimentData = [
  { week: "Aug 4", positive: 64, neutral: 28, negative: 8 },
  { week: "Aug 11", positive: 61, neutral: 30, negative: 9 },
  { week: "Aug 18", positive: 67, neutral: 25, negative: 8 },
  { week: "Aug 25", positive: 70, neutral: 23, negative: 7 },
];

const channelMix = [
  { channel: "FHIR", value: 38 },
  { channel: "HL7", value: 22 },
  { channel: "Claims", value: 19 },
  { channel: "Eligibility", value: 13 },
  { channel: "Custom", value: 8 },
];

const sentimentColors = {
  positive: "#34d399",
  neutral: "#93c5fd",
  negative: "#f97316",
};

const channelColors = [
  "#60a5fa",
  "#a855f7",
  "#f97316",
  "#34d399",
  "#facc15",
];

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
          const displayName = `${item.name ?? item.dataKey ?? "value"}`;
          const displayValue =
            typeof item.value === "number" ? item.value.toLocaleString() : item.value;

          return (
            <p
              key={`${item.dataKey}-${index}`}
              className="flex items-center justify-between gap-4 capitalize"
            >
              <span className="flex items-center gap-2" style={{ color }}>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {displayName}
              </span>
              <span className="text-white/70">{displayValue}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

const metrics = [
  {
    label: "Total MCP traffic",
    value: "28.4k",
    delta: "+12.6%",
    icon: Activity,
    direction: "up" as const,
  },
  {
    label: "Clinical accuracy",
    value: "98.4%",
    delta: "+1.8%",
    icon: Gauge,
    direction: "up" as const,
  },
  {
    label: "Escalations",
    value: "126",
    delta: "-4.2%",
    icon: AlertTriangle,
    direction: "down" as const,
  },
  {
    label: "Avg. latency",
    value: "721 ms",
    delta: "-8.5%",
    icon: TrendingUp,
    direction: "down" as const,
  },
];

export default function MCPAnalyticsPage() {
  return (
    <div className="flex flex-col gap-10 py-6 px-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <Badge className="border-white/20 bg-white/5 px-4 py-1 text-white/60">
              Weekly snapshot
            </Badge>
            <span className="flex items-center gap-2 text-white/40">
              <CalendarRange className="h-4 w-4" strokeWidth={1.4} />
              Aug 18 – Aug 24
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            MCP analytics dashboard
          </h1>
          {/* <p className="max-w-2xl text-sm text-white/60">
            Track message throughput, quality signals, and channel utilization across all managed MCP deployments. Identify regressions before they hit production.
          </p> */}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-white/20">
            <Download className="mr-2 h-4 w-4" strokeWidth={1.6} />
            Export report
          </Button>
          <Button className="bg-white text-[#0A0B14] hover:bg-white">
            Compare weeks
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const deltaColor =
            metric.direction === "down"
              ? "text-rose-400/80"
              : "text-emerald-400/80";
          return (
            <Card key={metric.label} className="m-0">
              <CardContent className="flex flex-col gap-4" style={{ margin: '0px' }}>
                <div className="flex items-center justify-between m-0">
                  <p className="text-xs uppercase tracking-[0.2em]  text-white">
                    {metric.label}
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 p-2">
                    <Icon className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{metric.value}</p>
                  <p className={`text-xs ${deltaColor}`}>{metric.delta} week over week</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="">
          <CardHeader>
            <CardTitle>Message throughput</CardTitle>
            <CardDescription>
              Daily message ingestion vs successful completions across all MCPs.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full pb-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ left: 0, right: 0, top: 10 }}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorCompletions" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.35)" />
                <YAxis tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.35)" />
                <Tooltip content={<AnalyticsTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
                <Area type="monotone" dataKey="messages" name="Messages" stroke="#60a5fa" fill="url(#colorMessages)" strokeWidth={2} />
                <Area type="monotone" dataKey="completions" name="Completions" stroke="#a855f7" fill="url(#colorCompletions)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="">
            <CardHeader>
              <CardTitle>Latency trend</CardTitle>
              <CardDescription>95th percentile response latency by time of day.</CardDescription>
            </CardHeader>
            <CardContent className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.35)" />
                  <YAxis tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.35)" />
                  <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="latency" fill="#34d399" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader>
              <CardTitle>Channel mix</CardTitle>
              <CardDescription>Share of MCP messages routed by connector.</CardDescription>
            </CardHeader>
            <CardContent className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelMix} dataKey="value" nameKey="channel" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {channelMix.map((entry, index) => (
                      <Cell key={entry.channel} fill={channelColors[index % channelColors.length]} />
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
            <CardTitle>Sentiment distribution</CardTitle>
            <CardDescription>MCP conversations classified by sentiment each week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.35)" />
                <YAxis tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.35)" />
                <Tooltip content={<AnalyticsTooltip />} />
                <Line type="monotone" dataKey="positive" stroke={sentimentColors.positive} strokeWidth={2} dot={false} name="Positive" />
                <Line type="monotone" dataKey="neutral" stroke={sentimentColors.neutral} strokeWidth={2} dot={false} name="Neutral" />
                <Line type="monotone" dataKey="negative" stroke={sentimentColors.negative} strokeWidth={2} dot={false} name="Negative" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Connector health</CardTitle>
            <CardDescription>
              Pulse of the top connectors across availability, error budget, and retrain cadence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: "Athena",
                availability: "99.98%",
                breaches: 1,
                retrain: "In 3 days",
              },
              {
                name: "Epic",
                availability: "99.92%",
                breaches: 3,
                retrain: "In 5 days",
              },
              {
                name: "Cerner",
                availability: "99.88%",
                breaches: 4,
                retrain: "In 8 days",
              },
              {
                name: "Custom HL7",
                availability: "99.76%",
                breaches: 6,
                retrain: "In 2 days",
              },
            ].map((connector) => (
              <div
                key={connector.name}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-white/50" strokeWidth={1.6} />
                    {connector.name}
                  </p>
                  <p className="text-xs text-white/55">
                    Next retrain: {connector.retrain}
                  </p>
                </div>
                <div className="text-right text-xs text-white/55">
                  <p className="text-sm font-semibold text-white">
                    {connector.availability}
                  </p>
                  <p>{connector.breaches} SLO breaches</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
