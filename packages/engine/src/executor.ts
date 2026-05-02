import { resolveFunction } from "@fuse/connectors";
import {
  type AnyNode,
  WorkflowGraph,
  renderValue,
  type TemplateContext,
} from "@fuse/core";
import { prisma, type WorkflowRun } from "@fuse/db";

import {
  IntegrationNotFoundError,
  NotImplementedNodeError,
  StepFailedError,
  WorkflowStoppedError,
} from "./errors.js";
import { runLLM } from "./llm.js";
import { withTimeout } from "./timeout.js";

const DEFAULT_HTTP_TIMEOUT_MS = 50_000;

interface ExecuteArgs {
  run: WorkflowRun;
  graph: WorkflowGraph;
}

export async function executeRun({ run, graph }: ExecuteArgs): Promise<{
  output: Record<string, unknown>;
}> {
  const triggerInput = (run.input ?? {}) as Record<string, unknown>;
  const ctx: TemplateContext = { trigger: { input: triggerInput } };
  const nodeOutputs: Record<string, unknown> = {};

  const completed = new Set<string>();
  const failed = new Set<string>();
  let failure: StepFailedError | undefined;

  const ready = (): AnyNode[] =>
    graph.nodes.filter((n) => {
      if (completed.has(n.id) || failed.has(n.id)) return false;
      const incoming = graph.incoming(n.id);
      return incoming.every((e) => completed.has(e.source));
    });

  while (true) {
    if (failure) break;
    const batch = ready();
    if (batch.length === 0) break;

    await Promise.all(
      batch.map(async (node) => {
        if (failure) return;
        try {
          const output = await runNode(node, run, graph, ctx);
          nodeOutputs[node.id] = output;
          ctx[node.id] = output;
          completed.add(node.id);
        } catch (err) {
          failed.add(node.id);
          if (!failure) {
            failure =
              err instanceof StepFailedError
                ? err
                : new StepFailedError(node.id, err);
          }
        }
      }),
    );
  }

  if (failure) throw failure;

  return { output: nodeOutputs };
}

async function runNode(
  node: AnyNode,
  run: WorkflowRun,
  graph: WorkflowGraph,
  ctx: TemplateContext,
): Promise<unknown> {
  const step = await prisma.workflowStepRun.create({
    data: {
      runId: run.id,
      nodeId: node.id,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    let renderedInput: unknown = null;
    let output: unknown;

    switch (node.kind) {
      case "trigger.manual":
      case "trigger.webhook":
      case "trigger.schedule": {
        output = (run.input ?? {}) as Record<string, unknown>;
        renderedInput = output;
        break;
      }
      case "action": {
        const fn = resolveFunction(node.integration, node.functionName);
        if (!fn) {
          throw new IntegrationNotFoundError(node.integration, node.functionName);
        }
        renderedInput = renderValue(node.config.input, ctx);
        output = await withTimeout(
          fn.invoke(renderedInput),
          fn.timeoutMs,
          `${node.integration}.${node.functionName}`,
        );
        break;
      }
      case "http": {
        const cfg = node.config;
        const url = String(renderValue(cfg.url, ctx));
        const headers = (renderValue(cfg.headers ?? {}, ctx) ?? {}) as Record<string, string>;
        const query = (renderValue(cfg.query ?? {}, ctx) ?? {}) as Record<string, string>;
        const body = cfg.body !== undefined ? renderValue(cfg.body, ctx) : undefined;
        renderedInput = { method: cfg.method, url, headers, query, body };
        output = await runHttp({
          method: cfg.method,
          url,
          headers,
          query,
          body,
          timeoutMs: cfg.timeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
        });
        break;
      }
      case "set": {
        renderedInput = renderValue(node.config.fields, ctx);
        output = renderedInput;
        break;
      }
      case "merge": {
        const incoming = graph.incoming(node.id).map((e) => e.source);
        const parts = incoming
          .map((id) => ctx[id])
          .filter((v) => v !== undefined);
        renderedInput = { mode: node.config.mode, sources: incoming };
        output = mergeValues(parts, node.config.mode);
        break;
      }
      case "wait": {
        const seconds = node.config.seconds;
        renderedInput = { seconds };
        await new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
        output = { waitedSeconds: seconds };
        break;
      }
      case "stop": {
        const reason = node.config.reason ?? "Stop node reached";
        throw new WorkflowStoppedError(node.id, reason);
      }
      case "llm": {
        const prompt = String(renderValue(node.config.prompt, ctx));
        renderedInput = { prompt, model: node.config.model };
        output = await runLLM({
          prompt,
          ...(node.config.model !== undefined && { model: node.config.model }),
        });
        break;
      }
      case "branch":
      case "filter":
      case "loop":
        throw new NotImplementedNodeError(node.kind, node.id);
    }

    await prisma.workflowStepRun.update({
      where: { id: step.id },
      data: {
        status: "SUCCEEDED",
        input: renderedInput as never,
        output: output as never,
        finishedAt: new Date(),
      },
    });
    return output;
  } catch (err) {
    await prisma.workflowStepRun.update({
      where: { id: step.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
        finishedAt: new Date(),
      },
    });
    if (err instanceof StepFailedError) throw err;
    throw new StepFailedError(node.id, err);
  }
}

interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  timeoutMs: number;
}

async function runHttp(req: HttpRequest): Promise<unknown> {
  const url = new URL(req.url);
  for (const [k, v] of Object.entries(req.query)) {
    url.searchParams.set(k, v);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs);

  try {
    const init: RequestInit = {
      method: req.method,
      headers: req.headers,
      signal: controller.signal,
    };
    if (req.body !== undefined && req.method !== "GET") {
      const isJsonish = typeof req.body === "object" && req.body !== null;
      init.body = isJsonish ? JSON.stringify(req.body) : String(req.body);
      if (isJsonish && !("Content-Type" in req.headers || "content-type" in req.headers)) {
        init.headers = { ...req.headers, "Content-Type": "application/json" };
      }
    }
    const res = await fetch(url, init);
    const text = await res.text();
    let data: unknown = text;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") && text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return {
      status: res.status,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      body: data,
    };
  } finally {
    clearTimeout(timer);
  }
}

function mergeValues(parts: unknown[], mode: "object" | "array" | "concat"): unknown {
  if (mode === "array") return parts;
  if (mode === "concat") {
    return parts.flatMap((p) => (Array.isArray(p) ? p : [p]));
  }
  // object: shallow-merge object parts; non-object parts ignored
  const out: Record<string, unknown> = {};
  for (const p of parts) {
    if (p && typeof p === "object" && !Array.isArray(p)) {
      Object.assign(out, p as Record<string, unknown>);
    }
  }
  return out;
}
