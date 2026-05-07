export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

const BOOLEAN_FLAGS = new Set([
  "-v",
  "--verbose",
  "-s",
  "--silent",
  "-S",
  "-k",
  "--insecure",
  "-L",
  "--location",
  "-i",
  "--include",
  "--compressed",
  "-O",
  "--remote-name",
  "-J",
  "--remote-header-name",
  "-#",
  "--progress-bar",
  "-f",
  "--fail",
]);

/**
 * Parse a `curl` command into a structural request. Handles the common cases
 * users paste from API docs / browser dev tools:
 *
 *   - `-X / --request`, `-H / --header`, `-d / --data / --data-raw`,
 *     `--url`, `-u / --user` (Basic auth)
 *   - line continuations (backslash + newline)
 *   - single- or double-quoted tokens
 *   - boolean flags we don't care about (-v, -s, -k, -L, …)
 *
 * Returns `null` if the input isn't a curl invocation or doesn't contain a URL.
 */
export function parseCurl(text: string): ParsedCurl | null {
  const collapsed = text.replace(/\\\s*\n/g, " ").trim();
  if (collapsed === "") return null;

  const tokens = tokenize(collapsed);
  if (tokens.length === 0 || tokens[0] !== "curl") return null;

  let method: string | undefined;
  let url: string | undefined;
  const headers: Record<string, string> = {};
  let body: string | undefined;
  let basicAuth: string | undefined;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i]!;

    if (t === "-X" || t === "--request") {
      method = tokens[++i]?.toUpperCase();
      continue;
    }
    if (t === "-H" || t === "--header") {
      const v = tokens[++i];
      if (!v) continue;
      const idx = v.indexOf(":");
      if (idx !== -1) {
        const name = v.slice(0, idx).trim();
        const value = v.slice(idx + 1).trim();
        if (name) headers[name] = value;
      }
      continue;
    }
    if (
      t === "-d" ||
      t === "--data" ||
      t === "--data-raw" ||
      t === "--data-binary"
    ) {
      const v = tokens[++i];
      if (v !== undefined) body = v;
      continue;
    }
    if (t === "-u" || t === "--user") {
      basicAuth = tokens[++i];
      continue;
    }
    if (t === "--url") {
      const v = tokens[++i];
      if (v) url = v;
      continue;
    }
    if (BOOLEAN_FLAGS.has(t)) continue;

    if (t.startsWith("-")) {
      // Unknown flag — many take a value; skip the next token defensively
      // unless the flag itself is followed by `=`.
      if (!t.includes("=") && tokens[i + 1] && !tokens[i + 1]!.startsWith("-")) {
        i++;
      }
      continue;
    }

    // Positional — assume it's the URL.
    if (!url) url = t;
  }

  if (!url) return null;
  const finalMethod = method ?? (body !== undefined ? "POST" : "GET");

  if (
    basicAuth &&
    !("Authorization" in headers) &&
    !("authorization" in headers)
  ) {
    const encoded = base64(basicAuth);
    headers.Authorization = `Basic ${encoded}`;
  }

  return {
    method: finalMethod,
    url,
    headers,
    ...(body !== undefined && { body }),
  };
}

function tokenize(s: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i++;
    if (i >= s.length) break;

    let token = "";
    while (i < s.length && !/\s/.test(s[i]!)) {
      const c = s[i]!;
      if (c === "'") {
        i++;
        while (i < s.length && s[i] !== "'") {
          token += s[i];
          i++;
        }
        i++;
      } else if (c === '"') {
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === "\\" && i + 1 < s.length) {
            const next = s[i + 1]!;
            if (next === '"' || next === "\\") {
              token += next;
              i += 2;
              continue;
            }
          }
          token += s[i];
          i++;
        }
        i++;
      } else {
        token += c;
        i++;
      }
    }
    tokens.push(token);
  }
  return tokens;
}

function base64(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s, "utf8").toString("base64");
  // Browser fallback
  return btoa(s);
}
