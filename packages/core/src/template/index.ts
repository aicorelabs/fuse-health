// Template engine: resolves {{ node.id.field }} references in node configs
// against a run-time context. Real implementation comes when the engine lands;
// this stub keeps the package import-shape stable.

export type TemplateContext = Record<string, unknown>;

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

export function renderTemplate(input: string, context: TemplateContext): string {
  return input.replace(TEMPLATE_RE, (_match, expr: string) => {
    const value = resolvePath(context, expr.trim());
    return value === undefined ? "" : String(value);
  });
}

function resolvePath(ctx: TemplateContext, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, ctx);
}
