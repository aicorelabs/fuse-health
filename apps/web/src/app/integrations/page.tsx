import Link from "next/link";

import {
  listIntegrations,
  registerBuiltInIntegrations,
} from "@fuse/connectors";

export const dynamic = "force-dynamic";

export default function IntegrationsPage() {
  registerBuiltInIntegrations();
  const all = listIntegrations()
    .map((i) => i.toJSON())
    .sort((a, b) => a.label.localeCompare(b.label));

  // Group by category. Order categories by first-seen for stability.
  const byCategory = new Map<string, typeof all>();
  for (const i of all) {
    const list = byCategory.get(i.category) ?? [];
    list.push(i);
    byCategory.set(i.category, list);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-12 px-6 py-16">
      <header className="flex items-end justify-between gap-6 border-b border-stone-200 pb-7 dark:border-stone-800">
        <div className="space-y-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
          >
            <span aria-hidden>←</span> Workflows
          </Link>
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
            Catalog
          </div>
          <h1 className="text-[28px] font-semibold leading-none tracking-tight">
            Integrations
          </h1>
          <p className="max-w-xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
            Built-in connectors callable from any workflow&apos;s{" "}
            <code className="font-mono text-[13px] text-stone-700 dark:text-stone-300">
              action
            </code>{" "}
            node. All v1 integrations are mocked — sample data shown is what an
            authoring run sees today.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
            Total
          </div>
          <div className="font-mono text-[20px] tabular text-stone-900 dark:text-stone-100">
            {all.length}
          </div>
        </div>
      </header>

      {[...byCategory.entries()].map(([category, items]) => (
        <section key={category} className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {category}
            </h2>
            <span className="font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
              {items.length}
            </span>
          </div>
          <ul className="space-y-6">
            {items.map((i) => (
              <IntegrationCard key={i.name} integration={i} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

interface IntegrationJSON {
  name: string;
  label: string;
  description: string;
  category: string;
  functions: Array<{
    name: string;
    description: string;
    timeoutMs: number;
    sampleInput?: unknown;
    sampleOutput?: unknown;
  }>;
}

function IntegrationCard({ integration }: { integration: IntegrationJSON }) {
  return (
    <li className="space-y-3 border-l-2 border-stone-200 pl-5 dark:border-stone-800">
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <h3 className="text-[16px] font-medium tracking-tight text-stone-900 dark:text-stone-100">
            {integration.label}
          </h3>
          <code className="font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
            {integration.name}
          </code>
        </div>
        <p className="max-w-2xl text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">
          {integration.description}
        </p>
      </div>

      <div className="space-y-2">
        {integration.functions.map((fn) => (
          <FunctionRow
            key={fn.name}
            integrationName={integration.name}
            fn={fn}
          />
        ))}
      </div>
    </li>
  );
}

function FunctionRow({
  integrationName,
  fn,
}: {
  integrationName: string;
  fn: IntegrationJSON["functions"][number];
}) {
  return (
    <details className="group rounded-sm border border-stone-200 dark:border-stone-800">
      <summary className="flex cursor-pointer items-baseline justify-between gap-4 px-3 py-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/60">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="font-mono text-[11.5px] text-stone-400 dark:text-stone-500">
            {integrationName}.
          </span>
          <span className="font-mono text-[12.5px] tracking-tight text-stone-900 dark:text-stone-100">
            {fn.name}
          </span>
        </div>
        <span className="hidden font-mono text-[10px] tabular text-stone-400 sm:inline dark:text-stone-500">
          ≤{Math.round(fn.timeoutMs / 1000)}s
        </span>
      </summary>
      <div className="space-y-3 border-t border-stone-100 px-3 py-3 dark:border-stone-800/60">
        <p className="text-[12.5px] leading-relaxed text-stone-600 dark:text-stone-400">
          {fn.description}
        </p>
        {fn.sampleInput !== undefined && (
          <SampleBlock label="Sample input" value={fn.sampleInput} />
        )}
        {fn.sampleOutput !== undefined && (
          <SampleBlock label="Sample output" value={fn.sampleOutput} />
        )}
      </div>
    </details>
  );
}

function SampleBlock({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <pre className="max-h-72 overflow-auto border-l border-stone-200 bg-stone-50 px-3 py-2 font-mono text-[11px] leading-relaxed dark:border-stone-800 dark:bg-stone-950/40">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
