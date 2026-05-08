import Link from "next/link";

import { prisma } from "@fuse/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface AuditQuery {
  resourceType?: string;
  resourceId?: string;
  action?: string;
  cursor?: string;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q: AuditQuery = {
    resourceType: typeof sp.resourceType === "string" ? sp.resourceType : undefined,
    resourceId: typeof sp.resourceId === "string" ? sp.resourceId : undefined,
    action: typeof sp.action === "string" ? sp.action : undefined,
    cursor: typeof sp.cursor === "string" ? sp.cursor : undefined,
  };

  const where: Record<string, unknown> = {};
  if (q.resourceType) where.resourceType = q.resourceType;
  if (q.resourceId) where.resourceId = q.resourceId;
  if (q.action) where.action = q.action;

  const entries = await prisma.auditEntry.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
    ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
  });

  const nextCursor =
    entries.length === PAGE_SIZE ? entries[entries.length - 1]!.id : null;

  // For the filter "chip" UI, derive distinct values that exist in the DB.
  const [resourceTypes, actions] = await Promise.all([
    prisma.auditEntry
      .findMany({ select: { resourceType: true }, distinct: ["resourceType"] })
      .then((r) => r.map((x) => x.resourceType).sort()),
    prisma.auditEntry
      .findMany({ select: { action: true }, distinct: ["action"] })
      .then((r) => r.map((x) => x.action).sort()),
  ]);

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
          System
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight">
          Audit log
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
          Append-only timeline of every workflow / integration / function CRUD
          plus run lifecycle. Most recent first.
        </p>
      </header>

      <FilterBar
        current={q}
        resourceTypes={resourceTypes}
        actions={actions}
      />

      {entries.length === 0 ? (
        <div className="border-l-2 border-stone-300 px-4 py-4 text-[13px] leading-relaxed text-stone-500 dark:border-stone-700 dark:text-stone-400">
          No entries match these filters.
        </div>
      ) : (
        <ol className="-mx-2 space-y-0">
          {entries.map((e, i) => (
            <li
              key={e.id}
              className={
                i > 0
                  ? "border-t border-stone-100 dark:border-stone-800/60"
                  : ""
              }
            >
              <Entry entry={e} />
            </li>
          ))}
        </ol>
      )}

      {nextCursor && (
        <Link
          href={
            `/audit?` +
            new URLSearchParams({
              ...(q.resourceType && { resourceType: q.resourceType }),
              ...(q.resourceId && { resourceId: q.resourceId }),
              ...(q.action && { action: q.action }),
              cursor: nextCursor,
            }).toString()
          }
          className="self-start rounded-sm border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
        >
          Load more →
        </Link>
      )}
    </main>
  );
}

function FilterBar({
  current,
  resourceTypes,
  actions,
}: {
  current: AuditQuery;
  resourceTypes: string[];
  actions: string[];
}) {
  function paramsWithout(key: keyof AuditQuery): string {
    const next = { ...current };
    delete next[key];
    delete next.cursor;
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (typeof v === "string" && v) sp.set(k, v);
    }
    return sp.toString();
  }

  function paramsWith(key: keyof AuditQuery, value: string): string {
    const next = { ...current, [key]: value };
    delete next.cursor;
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (typeof v === "string" && v) sp.set(k, v);
    }
    return sp.toString();
  }

  const anyActive =
    current.resourceType || current.resourceId || current.action;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <FilterGroup
          label="Resource"
          values={resourceTypes}
          current={current.resourceType}
          paramsWith={(v) => paramsWith("resourceType", v)}
          paramsClear={() => paramsWithout("resourceType")}
        />
        <FilterGroup
          label="Action"
          values={actions}
          current={current.action}
          paramsWith={(v) => paramsWith("action", v)}
          paramsClear={() => paramsWithout("action")}
        />
      </div>

      {current.resourceId && (
        <div className="flex items-baseline gap-2 font-mono text-[11px] tabular text-stone-500 dark:text-stone-400">
          <span>resource:</span>
          <span className="text-stone-700 dark:text-stone-200">
            {current.resourceId}
          </span>
          <Link
            href={`/audit?${paramsWithout("resourceId")}`}
            className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-300"
          >
            ×
          </Link>
        </div>
      )}

      {anyActive && (
        <Link
          href="/audit"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
        >
          clear all
        </Link>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  values,
  current,
  paramsWith,
  paramsClear,
}: {
  label: string;
  values: string[];
  current?: string;
  paramsWith: (value: string) => string;
  paramsClear: () => string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => {
          const active = v === current;
          return (
            <Link
              key={v}
              href={active ? `/audit?${paramsClear()}` : `/audit?${paramsWith(v)}`}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                active
                  ? "border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-200 text-stone-600 hover:border-stone-400 dark:border-stone-800 dark:text-stone-400"
              }`}
            >
              {v}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface AuditEntryRow {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: unknown;
  createdAt: Date;
}

function Entry({ entry }: { entry: AuditEntryRow }) {
  return (
    <details className="group px-2 py-2.5">
      <summary className="flex cursor-pointer items-baseline justify-between gap-3 text-[12.5px]">
        <div className="flex min-w-0 items-baseline gap-3">
          <span
            className={`block h-1.5 w-1.5 shrink-0 ${actorDot(entry.actorType)}`}
            aria-hidden
          />
          <span className="font-mono text-[12px] text-stone-900 dark:text-stone-100">
            {entry.action}
          </span>
          <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
            {entry.resourceType}/{entry.resourceId}
          </span>
        </div>
        <span className="font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
          {entry.createdAt.toISOString().replace("T", " ").slice(0, 19)}
        </span>
      </summary>
      <div className="mt-2 space-y-2 px-3 text-[11.5px] text-stone-600 dark:text-stone-400">
        <div>
          actor: {entry.actorType}
          {entry.actorId ? ` (${entry.actorId})` : ""}
        </div>
        {entry.metadata !== null && entry.metadata !== undefined && (
          <pre className="overflow-auto border-l border-stone-200 bg-stone-50 px-2 py-1.5 font-mono text-[10.5px] leading-relaxed dark:border-stone-800 dark:bg-stone-950/40">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        )}
      </div>
    </details>
  );
}

function actorDot(actorType: string): string {
  switch (actorType) {
    case "engine":
      return "bg-amber-500/70";
    case "admin":
      return "bg-sky-500/70";
    default:
      return "bg-stone-400/70";
  }
}
