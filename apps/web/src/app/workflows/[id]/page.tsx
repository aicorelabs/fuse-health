import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@fuse/db";

import { RunForm } from "./RunForm";

export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) notFound();

  const recentRuns = await prisma.workflowRun.findMany({
    where: { workflowId: id, isPartial: false },
    select: {
      id: true,
      status: true,
      createdAt: true,
      finishedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const auditEntries = await prisma.auditEntry.findMany({
    where: {
      OR: [
        { resourceType: "workflow", resourceId: id },
        // Run lifecycle events live under resourceType=run; we'd need to
        // join via workflowId. Simpler: look up the run ids first.
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 10,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-12">
      <nav>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
        >
          <span aria-hidden>←</span> Workflows
        </Link>
      </nav>

      <header className="space-y-3 border-b border-stone-200 pb-7 dark:border-stone-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
              Workflow
            </div>
            <h1 className="text-[28px] font-semibold leading-none tracking-tight">
              {workflow.name}
            </h1>
          </div>
          <Link
            href={`/workflows/${workflow.id}/edit`}
            className="shrink-0 rounded-sm border border-stone-200 px-3 py-1.5 text-[12.5px] font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
          >
            Edit
          </Link>
        </div>
        {workflow.description && (
          <p className="max-w-2xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
            {workflow.description}
          </p>
        )}
        <div className="flex items-center gap-4 pt-1">
          <span className="font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
            {workflow.id}
          </span>
          <span className="font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
            max {workflow.maxConcurrent} concurrent
          </span>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Run
        </h2>
        <RunForm workflowId={workflow.id} />
      </section>

      {recentRuns.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Recent runs
          </h2>
          <ul className="-mx-2">
            {recentRuns.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between gap-4 border-t border-stone-100 px-2 py-2.5 text-[12.5px] transition-colors hover:bg-stone-100/50 dark:border-stone-800/60 dark:hover:bg-stone-900/50"
                >
                  <span className="font-mono text-[11px] tabular text-stone-500 dark:text-stone-400">
                    {run.id}
                  </span>
                  <StatusTag status={run.status} />
                </Link>
              </li>
            ))}
            <li className="border-t border-stone-100 dark:border-stone-800/60" />
          </ul>
        </section>
      )}

      {auditEntries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Activity
            </h2>
            <Link
              href={`/audit?resourceType=workflow&resourceId=${workflow.id}`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              full log →
            </Link>
          </div>
          <ul className="-mx-2">
            {auditEntries.map((e, i) => (
              <li
                key={e.id}
                className={`px-2 py-2 ${
                  i > 0
                    ? "border-t border-stone-100 dark:border-stone-800/60"
                    : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[12px] text-stone-900 dark:text-stone-100">
                    {e.action}
                  </span>
                  <span className="font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
                    {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="group rounded-sm border border-stone-200 dark:border-stone-800">
        <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/60">
          <span className="font-mono text-[10px] text-stone-400 group-open:hidden">
            +
          </span>
          <span className="hidden font-mono text-[10px] text-stone-400 group-open:inline">
            −
          </span>
          Graph JSON
        </summary>
        <pre className="overflow-auto border-t border-stone-100 bg-stone-50 px-3 py-3 font-mono text-[11px] leading-relaxed dark:border-stone-800/60 dark:bg-stone-950/40">
          {JSON.stringify(workflow.graph, null, 2)}
        </pre>
      </details>
    </main>
  );
}

function StatusTag({ status }: { status: string }) {
  const dotClass =
    status === "SUCCEEDED"
      ? "bg-emerald-500"
      : status === "FAILED"
        ? "bg-rose-500"
        : status === "RUNNING"
          ? "bg-amber-500"
          : status === "SKIPPED"
            ? "bg-stone-400"
            : "bg-stone-400";
  const textClass =
    status === "SUCCEEDED"
      ? "text-emerald-700 dark:text-emerald-300"
      : status === "FAILED"
        ? "text-rose-700 dark:text-rose-300"
        : status === "RUNNING"
          ? "text-amber-700 dark:text-amber-300"
          : "text-stone-500 dark:text-stone-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] ${textClass}`}
    >
      <span className={`block h-1.5 w-1.5 ${dotClass}`} aria-hidden />
      {status.toLowerCase()}
    </span>
  );
}
