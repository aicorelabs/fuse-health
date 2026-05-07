import Link from "next/link";

import { IntegrationFormShell } from "../_form/IntegrationFormShell";

export const dynamic = "force-dynamic";

export default function NewIntegrationPage() {
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
          New
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight">
          Custom integration
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
          Define an HTTP API as an integration. Add functions afterward, each
          with its own method, path, and body template. Auth and other
          secrets live as <code className="font-mono">{"{{ env.NAME }}"}</code>{" "}
          references resolved at run time.
        </p>
      </header>

      <IntegrationFormShell mode="create" />
    </main>
  );
}
