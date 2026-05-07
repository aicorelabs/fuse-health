import Link from "next/link";

import { prisma } from "@fuse/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      maxConcurrent: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-12 px-6 py-16">
      <header className="flex items-end justify-between gap-6 border-b border-stone-200 pb-7 dark:border-stone-800">
        <div className="space-y-2.5">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
            Fuse · Workflow studio
          </div>
          <h1 className="text-[28px] font-semibold leading-none tracking-tight">
            Workflows
          </h1>
          <p className="max-w-xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
            AI-native workflow automation for healthcare. Self-hosted, local
            Postgres, MCP-ready.
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="shrink-0 rounded-sm bg-stone-900 px-3.5 py-1.5 text-[12.5px] font-medium text-stone-50 transition-colors hover:bg-stone-700 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          New workflow
        </Link>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            All workflows
          </h2>
          <span className="font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
            {workflows.length}
          </span>
        </div>

        {workflows.length === 0 ? (
          <div className="border-l-2 border-stone-300 px-4 py-4 text-[13px] leading-relaxed text-stone-500 dark:border-stone-700 dark:text-stone-400">
            <p>No workflows yet.</p>
            <p className="mt-1">
              Run{" "}
              <code className="font-mono text-[12px] text-stone-700 dark:text-stone-300">
                pnpm db:seed
              </code>{" "}
              to insert the demo, or{" "}
              <Link
                href="/workflows/new"
                className="text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500 dark:text-stone-300 dark:decoration-stone-700 dark:hover:text-stone-100"
              >
                start from scratch
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="-mx-2">
            {workflows.map((wf, i) => (
              <li key={wf.id}>
                <Link
                  href={`/workflows/${wf.id}`}
                  className={`group flex items-start justify-between gap-6 px-2 py-4 transition-colors hover:bg-stone-100/60 dark:hover:bg-stone-900/50 ${
                    i > 0
                      ? "border-t border-stone-100 dark:border-stone-800/60"
                      : ""
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="text-[15px] font-medium tracking-tight text-stone-900 dark:text-stone-100">
                      {wf.name}
                    </div>
                    {wf.description && (
                      <div className="max-w-xl text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">
                        {wf.description}
                      </div>
                    )}
                    <div className="font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
                      {wf.id}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500">
                      max {wf.maxConcurrent}
                    </div>
                    <div className="mt-2 text-[11px] text-stone-400 transition-colors group-hover:text-stone-700 dark:group-hover:text-stone-300">
                      Open →
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            <li className="border-t border-stone-100 dark:border-stone-800/60" />
          </ul>
        )}
      </section>
    </main>
  );
}
