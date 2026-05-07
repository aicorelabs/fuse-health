import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@fuse/db";

import { FunctionsManager } from "../../_form/FunctionsManager";
import { IntegrationFormShell } from "../../_form/IntegrationFormShell";

export const dynamic = "force-dynamic";

export default async function EditCustomIntegrationPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const row = await prisma.customIntegration.findUnique({
    where: { name },
    include: { functions: { orderBy: { name: "asc" } } },
  });
  if (!row) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-12">
      <nav>
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
        >
          <span aria-hidden>←</span> Integrations
        </Link>
      </nav>

      <header className="space-y-2 border-b border-stone-200 pb-7 dark:border-stone-800">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
          Edit · custom integration
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight">
          {row.label}
        </h1>
        <div className="font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
          {row.name}
        </div>
      </header>

      <IntegrationFormShell
        mode="update"
        initial={{
          name: row.name,
          label: row.label,
          description: row.description,
          category: row.category,
          baseUrl: row.baseUrl ?? "",
          defaultHeaders: (row.defaultHeaders ?? {}) as Record<string, string>,
        }}
      />

      <FunctionsManager
        integrationName={row.name}
        functions={row.functions.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          method: f.method,
          pathTemplate: f.pathTemplate,
          headers: f.headers,
          query: f.query,
          bodyTemplate: f.bodyTemplate,
          timeoutMs: f.timeoutMs,
          sampleInput: f.sampleInput,
          sampleOutput: f.sampleOutput,
        }))}
      />
    </main>
  );
}
