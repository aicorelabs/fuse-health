// Template engine: resolves {{ path.to.value }} references against a context.
// A string whose entire content is one template ref keeps the resolved
// value's type (object/array/number). Strings with embedded refs stringify.

export type TemplateContext = Record<string, unknown>;

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;
const SOLO_TEMPLATE_RE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

export function renderTemplate(input: string, context: TemplateContext): string {
  return input.replace(TEMPLATE_RE, (_match, expr: string) => {
    const value = resolvePath(context, expr.trim());
    return value === undefined ? "" : String(value);
  });
}

export function renderValue(input: unknown, context: TemplateContext): unknown {
  if (typeof input === "string") {
    const solo = SOLO_TEMPLATE_RE.exec(input);
    if (solo) {
      const expr = solo[1];
      if (expr === undefined) return input;
      return resolvePath(context, expr.trim());
    }
    return renderTemplate(input, context);
  }
  if (Array.isArray(input)) {
    return input.map((item) => renderValue(item, context));
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = renderValue(v, context);
    }
    return out;
  }
  return input;
}

function resolvePath(ctx: TemplateContext, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, ctx);
}
