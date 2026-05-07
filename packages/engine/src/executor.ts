import { resolveFunction } from "@fuse/connectors";
import {
  type AnyNode,
  type ConditionOp,
  isTriggerKind,
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
  const skipped = new Set<string>();
  const failed = new Set<string>();
  // Edges whose source decided NOT to fire them (filter=false; branch non-matching cases).
  const skippedEdges = new Set<string>();
  let failure: StepFailedError | undefined;

  // A node is "resolved" when each incoming edge's source is terminal.
  const isReadyToProcess = (n: AnyNode): boolean => {
    if (completed.has(n.id) || skipped.has(n.id) || failed.has(n.id)) return false;
    return graph
      .incoming(n.id)
      .every((e) => completed.has(e.source) || skipped.has(e.source));
  };

  // Among "ready" nodes, those whose every incoming edge is closed (source skipped
  // OR edge in skippedEdges) should themselves be skipped — propagation.
  const isClosedEdge = (edgeId: string, sourceId: string): boolean =>
    skipped.has(sourceId) || skippedEdges.has(edgeId);

  const shouldSkip = (n: AnyNode): boolean => {
    const incoming = graph.incoming(n.id);
    if (incoming.length === 0) return false;
    return incoming.every((e) => isClosedEdge(e.id, e.source));
  };

  while (true) {
    if (failure) break;
    const ready = graph.nodes.filter(isReadyToProcess);
    if (ready.length === 0) break;

    const toSkip = ready.filter((n) => shouldSkip(n));
    const toRun = ready.filter((n) => !toSkip.includes(n));

    // Mark skipped nodes (write step row + propagate to outgoing edges).
    for (const node of toSkip) {
      const now = new Date();
      await prisma.workflowStepRun.create({
        data: {
          runId: run.id,
          nodeId: node.id,
          status: "SKIPPED",
          startedAt: now,
          finishedAt: now,
        },
      });
      skipped.add(node.id);
      for (const edge of graph.outgoing(node.id)) {
        skippedEdges.add(edge.id);
      }
    }

    // Run the rest in parallel.
    await Promise.all(
      toRun.map(async (node) => {
        if (failure) return;
        try {
          if (node.kind === "loop") {
            const { bodyId, output } = await runLoop(node, run, graph, ctx);
            nodeOutputs[node.id] = output;
            nodeOutputs[bodyId] = output;
            ctx[node.id] = output;
            ctx[bodyId] = output;
            completed.add(node.id);
            completed.add(bodyId);
            return;
          }

          const output = await runNode(node, run, graph, ctx);
          nodeOutputs[node.id] = output;
          if (!isTriggerKind(node.kind)) {
            ctx[node.id] = output;
          }
          completed.add(node.id);

          // Filter false → mark all outgoing edges as skipped, propagating to downstream.
          if (node.kind === "filter") {
            const passed = (output as { passed: boolean }).passed;
            if (!passed) {
              for (const edge of graph.outgoing(node.id)) {
                skippedEdges.add(edge.id);
              }
            }
          }

          // Branch → only the edge whose condition matches the picked case fires.
          if (node.kind === "branch") {
            const matched = (output as { matchedEdge: string | null }).matchedEdge;
            for (const edge of graph.outgoing(node.id)) {
              if (edge.condition !== matched) {
                skippedEdges.add(edge.id);
              }
            }
          }
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

    // If we made no progress (nothing to run, nothing to skip), break to avoid a
    // tight loop. This shouldn't happen with a correct graph.
    if (toRun.length === 0 && toSkip.length === 0) break;
  }

  if (failure) throw failure;

  return { output: nodeOutputs };
}

export function evaluateCondition(
  op: ConditionOp,
  left: unknown,
  right: unknown,
): boolean {
  switch (op) {
    case "==":
      // eslint-disable-next-line eqeqeq
      return left == right;
    case "!=":
      // eslint-disable-next-line eqeqeq
      return left != right;
    case "===":
      return left === right;
    case "!==":
      return left !== right;
    case ">":
      return Number(left) > Number(right);
    case "<":
      return Number(left) < Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<=":
      return Number(left) <= Number(right);
    case "in":
      return Array.isArray(right) && (right as unknown[]).includes(left);
    case "truthy":
      return Boolean(left);
    case "falsy":
      return !left;
  }
}

// Pure switch — computes a node's output without any DB writes.
// Used both by `runNode` (which wraps it with step-row IO) and by `runLoop`
// (which writes its own aggregated step rows for the loop body).
async function computeNodeOutput(
  node: AnyNode,
  run: WorkflowRun,
  graph: WorkflowGraph,
  ctx: TemplateContext,
): Promise<{ renderedInput: unknown; output: unknown }> {
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
    case "filter": {
      const cond = node.config.condition;
      const left = renderValue(cond.left, ctx);
      const right =
        cond.right !== undefined ? renderValue(cond.right, ctx) : undefined;
      const passed = evaluateCondition(cond.op, left, right);
      renderedInput = { left, op: cond.op, right };
      output = { passed };
      break;
    }
    case "branch": {
      const cfg = node.config;
      let matchedEdge: string | null = null;
      const evaluated: Array<{ edge: string; matched: boolean }> = [];
      for (const c of cfg.cases) {
        const left = renderValue(c.when.left, ctx);
        const right =
          c.when.right !== undefined ? renderValue(c.when.right, ctx) : undefined;
        const matched = evaluateCondition(c.when.op, left, right);
        evaluated.push({ edge: c.edge, matched });
        if (matched) {
          matchedEdge = c.edge;
          break;
        }
      }
      if (matchedEdge === null && cfg.default !== undefined) {
        matchedEdge = cfg.default;
      }
      renderedInput = { cases: evaluated, default: cfg.default ?? null };
      output = { matchedEdge };
      break;
    }
    case "loop":
      // Loop is handled by runLoop in the executor's batch loop; calling
      // computeNodeOutput on a loop indicates a nested loop body, which v1 does not support.
      throw new NotImplementedNodeError(node.kind, node.id);
  }

  return { renderedInput, output };
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
    const { renderedInput, output } = await computeNodeOutput(node, run, graph, ctx);
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

// Loop v1: single-node body identified by the loop's single outgoing edge.
// Iterates sequentially over the array `over` resolves to. Per iteration sets
// ctx[itemVar] and runs the body via computeNodeOutput; one aggregate step row
// is written for the loop AND for the body, with output = array of body outputs.
async function runLoop(
  node: AnyNode & { kind: "loop" },
  run: WorkflowRun,
  graph: WorkflowGraph,
  ctx: TemplateContext,
): Promise<{ bodyId: string; output: unknown[] }> {
  const cfg = node.config;
  const outgoing = graph.outgoing(node.id);
  if (outgoing.length !== 1) {
    throw new StepFailedError(
      node.id,
      new Error(
        `loop node must have exactly one outgoing edge (got ${outgoing.length})`,
      ),
    );
  }
  const bodyEdge = outgoing[0]!;
  const body = graph.nodeById(bodyEdge.target);
  if (!body) {
    throw new StepFailedError(
      node.id,
      new Error(`loop body node "${bodyEdge.target}" not found`),
    );
  }

  const overValue = renderValue(cfg.over, ctx);
  if (!Array.isArray(overValue)) {
    throw new StepFailedError(
      node.id,
      new Error(
        `loop "over" must resolve to an array; got ${typeof overValue}`,
      ),
    );
  }

  const itemVar = cfg.itemVar ?? "item";
  const previousItemValue = ctx[itemVar];

  const loopStartedAt = new Date();
  const loopStep = await prisma.workflowStepRun.create({
    data: {
      runId: run.id,
      nodeId: node.id,
      status: "RUNNING",
      input: { over: overValue, itemVar } as never,
      startedAt: loopStartedAt,
    },
  });
  const bodyStep = await prisma.workflowStepRun.create({
    data: {
      runId: run.id,
      nodeId: body.id,
      status: "RUNNING",
      startedAt: loopStartedAt,
    },
  });

  try {
    const bodyOutputs: unknown[] = [];
    for (const item of overValue) {
      ctx[itemVar] = item;
      const { output } = await computeNodeOutput(body, run, graph, ctx);
      bodyOutputs.push(output);
    }

    const finishedAt = new Date();
    await prisma.workflowStepRun.update({
      where: { id: bodyStep.id },
      data: {
        status: "SUCCEEDED",
        input: { itemVar, iterations: overValue.length } as never,
        output: bodyOutputs as never,
        finishedAt,
      },
    });
    await prisma.workflowStepRun.update({
      where: { id: loopStep.id },
      data: {
        status: "SUCCEEDED",
        output: bodyOutputs as never,
        finishedAt,
      },
    });

    return { bodyId: body.id, output: bodyOutputs };
  } catch (err) {
    const finishedAt = new Date();
    const message = err instanceof Error ? err.message : String(err);
    await prisma.workflowStepRun.update({
      where: { id: bodyStep.id },
      data: { status: "FAILED", error: message, finishedAt },
    });
    await prisma.workflowStepRun.update({
      where: { id: loopStep.id },
      data: { status: "FAILED", error: message, finishedAt },
    });
    if (err instanceof StepFailedError) throw err;
    throw new StepFailedError(node.id, err);
  } finally {
    if (previousItemValue === undefined) {
      delete ctx[itemVar];
    } else {
      ctx[itemVar] = previousItemValue;
    }
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
