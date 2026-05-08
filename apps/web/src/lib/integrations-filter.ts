import type { IntegrationListing } from "./integrations.js";

/**
 * Substring-match integrations + their functions against a free-text query.
 *
 * Match rules (all case-insensitive):
 *   - Integration matches when query appears in `label`, `name`, or
 *     `category`. When this happens, all functions are kept.
 *   - When the integration itself doesn't match but one or more of its
 *     functions matches (function `name` or `description`), the integration
 *     is included with `functions` narrowed to the matched ones.
 *   - Empty / whitespace-only query returns the listing unchanged.
 *
 * Order is preserved.
 */
export function filterIntegrations(
  listing: readonly IntegrationListing[],
  query: string,
): IntegrationListing[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...listing];

  const out: IntegrationListing[] = [];
  for (const integ of listing) {
    const integMatches =
      integ.label.toLowerCase().includes(q) ||
      integ.name.toLowerCase().includes(q) ||
      integ.category.toLowerCase().includes(q);

    if (integMatches) {
      out.push(integ);
      continue;
    }

    const matchedFns = integ.functions.filter((f) => {
      const inName = f.name.toLowerCase().includes(q);
      const inDesc =
        f.description !== undefined &&
        f.description.toLowerCase().includes(q);
      return inName || inDesc;
    });
    if (matchedFns.length > 0) {
      out.push({ ...integ, functions: matchedFns });
    }
  }
  return out;
}
