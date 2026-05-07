import { describe, expect, it } from "vitest";

import { parseCurl } from "../curlParser.js";

describe("parseCurl", () => {
  it("returns null for empty / non-curl input", () => {
    expect(parseCurl("")).toBeNull();
    expect(parseCurl("   ")).toBeNull();
    expect(parseCurl("wget https://x")).toBeNull();
  });

  it("parses a bare GET", () => {
    const r = parseCurl("curl https://api.example.com/things")!;
    expect(r.method).toBe("GET");
    expect(r.url).toBe("https://api.example.com/things");
    expect(r.headers).toEqual({});
    expect(r.body).toBeUndefined();
  });

  it("strips quotes around the URL", () => {
    expect(parseCurl(`curl 'https://api.example.com/v1?q=1'`)?.url).toBe(
      "https://api.example.com/v1?q=1",
    );
    expect(parseCurl(`curl "https://api.example.com/v1"`)?.url).toBe(
      "https://api.example.com/v1",
    );
  });

  it("respects -X METHOD and --request METHOD", () => {
    expect(parseCurl("curl -X PUT https://x.com/a")?.method).toBe("PUT");
    expect(parseCurl("curl --request PATCH https://x.com/a")?.method).toBe("PATCH");
  });

  it("collects multiple -H headers and --header", () => {
    const r = parseCurl(
      `curl -H 'Authorization: Bearer abc' --header 'X-Custom: 1' https://x.com/a`,
    )!;
    expect(r.headers).toEqual({
      Authorization: "Bearer abc",
      "X-Custom": "1",
    });
  });

  it("captures -d / --data / --data-raw bodies", () => {
    expect(parseCurl(`curl -d '{"x":1}' https://x.com/a`)?.body).toBe(
      '{"x":1}',
    );
    expect(
      parseCurl(`curl --data '{"x":2}' https://x.com/a`)?.body,
    ).toBe('{"x":2}');
    expect(
      parseCurl(`curl --data-raw '{"x":3}' https://x.com/a`)?.body,
    ).toBe('{"x":3}');
  });

  it("defaults to POST when a body is present and no -X is given", () => {
    expect(
      parseCurl(`curl -d '{"x":1}' https://x.com/a`)?.method,
    ).toBe("POST");
  });

  it("handles --url for the target instead of positional", () => {
    const r = parseCurl(
      `curl --request POST --url 'https://api.example.com/v1/users' --header 'Authorization: Bearer x'`,
    )!;
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://api.example.com/v1/users");
    expect(r.headers).toEqual({ Authorization: "Bearer x" });
  });

  it("collapses line continuations (`\\` followed by a newline)", () => {
    const text = `curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Authorization: Bearer abc' \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Folake"}'`;
    const r = parseCurl(text)!;
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://api.example.com/v1/users");
    expect(r.headers).toEqual({
      Authorization: "Bearer abc",
      "Content-Type": "application/json",
    });
    expect(r.body).toBe('{"name":"Folake"}');
  });

  it("converts -u / --user to a basic Authorization header", () => {
    const r = parseCurl(`curl -u admin:secret https://x.com/a`)!;
    const expected = `Basic ${Buffer.from("admin:secret").toString("base64")}`;
    expect(r.headers.Authorization).toBe(expected);
  });

  it("doesn't overwrite an explicit Authorization header with -u", () => {
    const r = parseCurl(
      `curl -u a:b -H 'Authorization: Bearer keep' https://x.com/a`,
    )!;
    expect(r.headers.Authorization).toBe("Bearer keep");
  });

  it("ignores boolean flags (-v, -s, -k, -L, --silent, --insecure)", () => {
    const r = parseCurl(`curl -v -s -k -L https://x.com/a`)!;
    expect(r.url).toBe("https://x.com/a");
    expect(r.method).toBe("GET");
  });

  it("returns null when no URL is found", () => {
    expect(parseCurl("curl -X POST")).toBeNull();
    expect(parseCurl(`curl -H 'X: y'`)).toBeNull();
  });

  it("preserves header values that include colons", () => {
    const r = parseCurl(
      `curl -H 'X-Range: bytes=0:99' https://x.com/a`,
    )!;
    expect(r.headers["X-Range"]).toBe("bytes=0:99");
  });

  it("trims whitespace inside header names", () => {
    const r = parseCurl(`curl -H 'Authorization:   Bearer x' https://x.com/a`)!;
    expect(r.headers.Authorization).toBe("Bearer x");
  });
});
