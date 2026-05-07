import { renderValue, type TemplateContext } from "@fuse/core";

export interface CustomIntegrationConfig {
  name: string;
  baseUrl: string | null;
  defaultHeaders: Record<string, string>;
}

export interface CustomFunctionConfig {
  method: string;
  pathTemplate: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  bodyTemplate: unknown;
  timeoutMs: number;
}

export interface RunCustomActionResult {
  /** Parsed response body (JSON if Content-Type matches; raw text otherwise). */
  output: unknown;
  /** The fully-resolved URL the engine actually called. */
  url: string;
  /** HTTP status code from the response. */
  status: number;
}

/**
 * Execute one call against a user-defined integration. Reuses the engine's
 * template engine for path / headers / query / body, then makes a real HTTP
 * call. Throws on non-2xx so the failure shows up in the run trace as a
 * normal step error.
 *
 * Templates have access to:
 *   - the action node's rendered `input` (flat object)
 *   - `env.<NAME>` for process env vars (self-host trust boundary)
 */
export async function runCustomAction(
  integ: CustomIntegrationConfig,
  fn: CustomFunctionConfig,
  input: Record<string, unknown>,
): Promise<RunCustomActionResult> {
  const ctx: TemplateContext = { ...input, env: envSubset() };

  const renderedPath = String(renderValue(fn.pathTemplate, ctx));
  const url = isAbsoluteUrl(renderedPath)
    ? renderedPath
    : joinUrl(integ.baseUrl ?? "", renderedPath);

  const mergedHeadersTemplate = { ...integ.defaultHeaders, ...fn.headers };
  const headers = stringifyValues(
    renderValue(mergedHeadersTemplate, ctx) as Record<string, unknown>,
  );
  const query = stringifyValues(
    renderValue(fn.query ?? {}, ctx) as Record<string, unknown>,
  );

  const body =
    fn.bodyTemplate !== undefined && fn.bodyTemplate !== null
      ? renderValue(fn.bodyTemplate, ctx)
      : undefined;

  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) {
    if (v !== "") u.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fn.timeoutMs);

  try {
    const init: RequestInit = {
      method: fn.method,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined && fn.method !== "GET" && fn.method !== "HEAD") {
      const isJsonish = typeof body === "object" && body !== null;
      init.body = isJsonish ? JSON.stringify(body) : String(body);
      if (
        isJsonish &&
        !hasHeader(headers, "Content-Type") &&
        !hasHeader(headers, "content-type")
      ) {
        init.headers = { ...headers, "Content-Type": "application/json" };
      }
    }

    const res = await fetch(u, init);
    const text = await res.text();
    let data: unknown = text;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.toLowerCase().includes("application/json") && text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const detail =
        typeof data === "string"
          ? data.slice(0, 200)
          : JSON.stringify(data).slice(0, 200);
      throw new Error(
        `${integ.name}.${fn.method} ${u.toString()} → HTTP ${res.status}: ${detail}`,
      );
    }

    return { output: data, url: u.toString(), status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

function isAbsoluteUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

function joinUrl(base: string, path: string): string {
  if (base === "") return path;
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
  return base + path;
}

function stringifyValues(
  obj: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

function hasHeader(h: Record<string, string>, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(h, name);
}

function envSubset(): Record<string, string> {
  // v1: expose all process.env. Self-host single-admin trust boundary; revisit
  // when multi-tenant or when integrations grow beyond a single operator.
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
