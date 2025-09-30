"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerOverviewQuery } from "@/lib/api";

export function McpServerOverviewCard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useServerOverviewQuery({
    retry: 1,
  });

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-white/90">
            MCP Server Overview
          </CardTitle>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs uppercase tracking-[0.25em] text-white/50 transition hover:text-white/80"
          >
            Refresh
          </button>
        </div>
        <p className="text-xs text-white/55">
          Real-time metadata pulled directly from the FastMCP backend.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 text-xs text-white/55">
            <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-56 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-48 animate-pulse rounded-full bg-white/10" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-rose-300/80">
              Unable to reach the MCP server
            </p>
            <p className="text-xs text-white/60">{error?.message}</p>
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Main Server
              </p>
              <p className="font-medium text-white/90">{data.main_server}</p>
              <p className="text-xs text-white/55">{data.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(data.component_servers).map(([key, server]) => (
                <div key={key} className="rounded-lg border border-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    {key}
                  </p>
                  <p className="text-sm font-medium text-white">{server.name}</p>
                  <p className="text-xs text-white/55">{server.description}</p>
                  {"tools" in server ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                        Tools
                      </p>
                      <ul className="space-y-1 text-xs text-white/70">
                        {server?.tools?.map((tool) => (
                          <li key={tool} className="rounded-md bg-white/5 px-2 py-1">
                            {tool}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-white/60">
              <div className="rounded-lg border border-white/10 p-3">
                <p className="uppercase tracking-[0.3em] text-white/35">Tools</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {data.integration.total_tools}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-3">
                <p className="uppercase tracking-[0.3em] text-white/35">Resources</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {data.integration.total_resources}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-3">
                <p className="uppercase tracking-[0.3em] text-white/35">Prompts</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {data.integration.total_prompts}
                </p>
              </div>
            </div>
            <p className="text-xs text-white/60">
              Gemini integration: {data.integration.gemini_ready ? "Configured" : "Missing"}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
