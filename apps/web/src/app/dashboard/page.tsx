import { logoutAction } from "../login/actions";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Sign out
          </button>
        </form>
      </header>
      <p className="text-neutral-600 dark:text-neutral-400">
        Workflow trigger UI lands here next. Pick a workflow, paste parameters, run.
      </p>
    </main>
  );
}
