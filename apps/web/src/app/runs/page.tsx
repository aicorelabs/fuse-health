import Link from "next/link";

import { prisma, type RunStatus } from "@fuse/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ALL_STATUSES: RunStatus[] = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "SKIPPED",
];

const SINCE_PRESETS: Array<{ label: string; value: string; days: number }> = [
  { label: "24h", value: "24h", days: 1 },
  { label: "7d", value: "7d", days: 7 },
  { label: "30d", value: "30d", days: 30 },
];

interface RunQuery {
  workflowId?: string;
  statuses: RunStatus[];
  since?: string; // preset value
  cursor?: string;
}

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const statusesParam = sp.status;
  const statusValues = Array.isArray(statusesParam)
    ? statusesParam
    : statusesParam
      ? [statusesParam]
      : [];
  const statuses = statusValues.filter((s): s is RunStatus =>
    ALL_STATUSES.includes(s as RunStatus),
  );

  const q: RunQuery = {
    workflowId: typeof sp.workflowId === "string" ? sp.workflowId : undefined,
    statuses,
    since: typeof sp.since === "string" ? sp.since : undefined,
    cursor: typeof sp.cursor === "string" ? sp.cursor : undefined,
  };

  const where: Record<string, unknown> = { isPartial: false };
  if (q.workflowId) where.workflowId = q.workflowId;
  if (q.statuses.length > 0) where.status = { in: q.statuses };
  const sincePreset = SINCE_PRESETS.find((p) => p.value === q.since);
  if (sincePreset) {
    where.createdAt = {
      gt: new Date(Date.now() - sincePreset.days * 24 * 3600 * 1000),
    };
  }

  const runs = await prisma.workflowRun.findMany({
    where,
    select: {
      id: true,
      workflowId: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      error: true,
      workflow: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
    ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
  });

  const nextCursor =
    runs.length === PAGE_SIZE ? runs[runs.length - 1]!.id : null;

  // For the workflow filter chip group, derive distinct workflows.
  const workflows = await prisma.workflow.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-12">
      <nav>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
        >
          <span aria-hidden>←</span> Workflows
        </Link>
      </nav>

      <header className="space-y-2 border-b border-stone-200 pb-7 dark:border-stone-800">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
          History
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight">
          Runs
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
          All runs except editor previews. Most recent first.
        </p>
      </header>

      <Filters current={q} workflows={workflows} />

      {runs.length === 0 ? (
        <div className="border-l-2 border-stone-300 px-4 py-4 text-[13px] leading-relaxed text-stone-500 dark:border-stone-700 dark:text-stone-400">
          No runs match these filters.
        </div>
      ) : (
        <ul className="-mx-2">
          {runs.map((run, i) => (
            <li
              key={run.id}
              className={
                i > 0
                  ? "border-t border-stone-100 dark:border-stone-800/60"
                  : ""
              }
            >
              <RunRow run={run} />
            </li>
          ))}
          <li className="border-t border-stone-100 dark:border-stone-800/60" />
        </ul>
      )}

      {nextCursor && (
        <Link
          href={`/runs?${buildQuery({ ...q, cursor: nextCursor })}`}
          className="self-start rounded-sm border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
        >
          Load more →
        </Link>
      )}
    </main>
  );
}

function buildQuery(q: RunQuery): string {
  const sp = new URLSearchParams();
  if (q.workflowId) sp.set("workflowId", q.workflowId);
  if (q.since) sp.set("since", q.since);
  if (q.cursor) sp.set("cursor", q.cursor);
  for (const s of q.statuses) sp.append("status", s);
  return sp.toString();
}

function Filters({
  current,
  workflows,
}: {
  current: RunQuery;
  workflows: Array<{ id: string; name: string }>;
}) {
  function toggleStatus(s: RunStatus): RunQuery {
    const has = current.statuses.includes(s);
    const statuses = has
      ? current.statuses.filter((x) => x !== s)
      : [...current.statuses, s];
    const next: RunQuery = { ...current, statuses };
    delete next.cursor;
    return next;
  }

  function withWorkflow(id: string | undefined): RunQuery {
    const next: RunQuery = { ...current };
    if (id) next.workflowId = id;
    else delete next.workflowId;
    delete next.cursor;
    return next;
  }

  function withSince(value: string | undefined): RunQuery {
    const next: RunQuery = { ...current };
    if (value) next.since = value;
    else delete next.since;
    delete next.cursor;
    return next;
  }

  const anyActive =
    current.workflowId || current.statuses.length > 0 || current.since;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <ChipGroup
          label="Status"
          values={ALL_STATUSES.map((s) => ({
            value: s,
            label: s.toLowerCase(),
            href: `/runs?${buildQuery(toggleStatus(s))}`,
            active: current.statuses.includes(s),
          }))}
        />
        <ChipGroup
          label="Since"
          values={SINCE_PRESETS.map((p) => ({
            value: p.value,
            label: p.label,
            href: `/runs?${buildQuery(
              withSince(current.since === p.value ? undefined : p.value),
            )}`,
            active: current.since === p.value,
          }))}
        />
      </div>

      {workflows.length > 1 && (
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Workflow
          </span>
          <div className="flex flex-wrap gap-1">
            <Link
              href={`/runs?${buildQuery(withWorkflow(undefined))}`}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                current.workflowId
                  ? "border-stone-200 text-stone-600 hover:border-stone-400 dark:border-stone-800 dark:text-stone-400"
                  : "border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
              }`}
            >
              all
            </Link>
            {workflows.map((wf) => (
              <Link
                key={wf.id}
                href={`/runs?${buildQuery(withWorkflow(wf.id))}`}
                className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                  current.workflowId === wf.id
                    ? "border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                    : "border-stone-200 text-stone-600 hover:border-stone-400 dark:border-stone-800 dark:text-stone-400"
                }`}
              >
                {wf.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {anyActive && (
        <Link
          href="/runs"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
        >
          clear all
        </Link>
      )}
    </div>
  );
}

function ChipGroup({
  label,
  values,
}: {
  label: string;
  values: Array<{ value: string; label: string; href: string; active: boolean }>;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <Link
            key={v.value}
            href={v.href}
            className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors ${
              v.active
                ? "border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                : "border-stone-200 text-stone-600 hover:border-stone-400 dark:border-stone-800 dark:text-stone-400"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface RunRowData {
  id: string;
  workflowId: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  error: string | null;
  workflow: { name: string };
}

function RunRow({ run }: { run: RunRowData }) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="flex items-baseline justify-between gap-4 px-2 py-2.5 transition-colors hover:bg-stone-100/50 dark:hover:bg-stone-900/50"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline gap-3">
          <StatusTag status={run.status} />
          <span className="truncate text-[13px] font-medium text-stone-900 dark:text-stone-100">
            {run.workflow.name}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-3 font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
          <span>{run.id}</span>
          <span>started {fmtTime(run.startedAt ?? run.createdAt)}</span>
          {run.finishedAt && run.startedAt && (
            <span>· {fmtDuration(run.startedAt, run.finishedAt)}</span>
          )}
        </div>
        {run.error && (
          <div className="truncate text-[11.5px] text-rose-600 dark:text-rose-400">
            {run.error}
          </div>
        )}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors group-hover:text-stone-700 dark:text-stone-500">
        open →
      </span>
    </Link>
  );
}

function StatusTag({ status }: { status: string }) {
  const dot =
    status === "SUCCEEDED"
      ? "bg-emerald-500"
      : status === "FAILED"
        ? "bg-rose-500"
        : status === "RUNNING"
          ? "bg-amber-500 animate-pulse"
          : status === "PENDING"
            ? "bg-stone-300 dark:bg-stone-600"
            : "bg-stone-400";
  const text =
    status === "SUCCEEDED"
      ? "text-emerald-700 dark:text-emerald-300"
      : status === "FAILED"
        ? "text-rose-700 dark:text-rose-300"
        : status === "RUNNING"
          ? "text-amber-700 dark:text-amber-300"
          : "text-stone-500 dark:text-stone-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] ${text}`}
    >
      <span className={`block h-1 w-1 ${dot}`} aria-hidden />
      {status.toLowerCase()}
    </span>
  );
}

function fmtTime(d: Date): string {
  const now = Date.now();
  const ms = now - d.getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return d.toISOString().slice(0, 10);
}

function fmtDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
