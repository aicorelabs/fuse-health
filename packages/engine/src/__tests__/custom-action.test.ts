import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCustomAction } from "../custom-action.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

describe("runCustomAction", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("performs a simple GET against an absolute path", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const r = await runCustomAction(
      { name: "test", baseUrl: null, defaultHeaders: {} },
      {
        method: "GET",
        pathTemplate: "https://api.example.com/things",
        headers: {},
        query: {},
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      {},
    );
    expect(r.status).toBe(200);
    expect(r.output).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0]!;
    expect((url as URL).toString()).toBe("https://api.example.com/things");
  });

  it("joins baseUrl + relative pathTemplate", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await runCustomAction(
      {
        name: "test",
        baseUrl: "https://api.example.com",
        defaultHeaders: {},
      },
      {
        method: "GET",
        pathTemplate: "/v1/users",
        headers: {},
        query: {},
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      {},
    );
    const [url] = fetchMock.mock.calls[0]!;
    expect((url as URL).toString()).toBe("https://api.example.com/v1/users");
  });

  it("renders {{ }} in the path template against input", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "abc" }));
    await runCustomAction(
      { name: "test", baseUrl: "https://api.example.com", defaultHeaders: {} },
      {
        method: "GET",
        pathTemplate: "/users/{{ patientId }}",
        headers: {},
        query: {},
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      { patientId: "p_001" },
    );
    const [url] = fetchMock.mock.calls[0]!;
    expect((url as URL).toString()).toBe(
      "https://api.example.com/users/p_001",
    );
  });

  it("merges defaultHeaders with function headers and renders templates", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    process.env.TEST_TOKEN_FOR_CUSTOM = "test-bearer";
    await runCustomAction(
      {
        name: "test",
        baseUrl: "https://api.example.com",
        defaultHeaders: {
          Authorization: "Bearer {{ env.TEST_TOKEN_FOR_CUSTOM }}",
        },
      },
      {
        method: "GET",
        pathTemplate: "/x",
        headers: { "X-Trace": "req-{{ requestId }}" },
        query: {},
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      { requestId: "abc" },
    );
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-bearer");
    expect(headers["X-Trace"]).toBe("req-abc");
    delete process.env.TEST_TOKEN_FOR_CUSTOM;
  });

  it("renders query params and appends them to the URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await runCustomAction(
      { name: "test", baseUrl: "https://api.example.com", defaultHeaders: {} },
      {
        method: "GET",
        pathTemplate: "/search",
        headers: {},
        query: { q: "{{ term }}", limit: "10" },
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      { term: "hello world" },
    );
    const [url] = fetchMock.mock.calls[0]!;
    const u = url as URL;
    expect(u.searchParams.get("q")).toBe("hello world");
    expect(u.searchParams.get("limit")).toBe("10");
  });

  it("sends a JSON body for POST when bodyTemplate is an object", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "new" }, 201));
    await runCustomAction(
      { name: "test", baseUrl: null, defaultHeaders: {} },
      {
        method: "POST",
        pathTemplate: "https://api.example.com/users",
        headers: {},
        query: {},
        bodyTemplate: { name: "{{ patientName }}", flag: true },
        timeoutMs: 5000,
      },
      { patientName: "Folake" },
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(
      JSON.stringify({ name: "Folake", flag: true }),
    );
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("does NOT send a body on GET even when bodyTemplate is set", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await runCustomAction(
      { name: "test", baseUrl: null, defaultHeaders: {} },
      {
        method: "GET",
        pathTemplate: "https://api.example.com/x",
        headers: {},
        query: {},
        bodyTemplate: { ignored: true },
        timeoutMs: 5000,
      },
      {},
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).body).toBeUndefined();
  });

  it("returns text when the response is not JSON", async () => {
    fetchMock.mockResolvedValue(textResponse("hello"));
    const r = await runCustomAction(
      { name: "test", baseUrl: null, defaultHeaders: {} },
      {
        method: "GET",
        pathTemplate: "https://api.example.com/x",
        headers: {},
        query: {},
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      {},
    );
    expect(r.output).toBe("hello");
  });

  it("throws when the response is non-2xx and includes status + body in the message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "nope" }, 404));
    await expect(
      runCustomAction(
        { name: "labs-real", baseUrl: null, defaultHeaders: {} },
        {
          method: "GET",
          pathTemplate: "https://api.example.com/x",
          headers: {},
          query: {},
          bodyTemplate: null,
          timeoutMs: 5000,
        },
        {},
      ),
    ).rejects.toThrow(/labs-real/);
  });

  it("renders {{ vars.X }} from per-integration variables in headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await runCustomAction(
      {
        name: "test",
        baseUrl: "https://api.example.com",
        defaultHeaders: { Authorization: "Bearer {{ vars.SLACK_TOKEN }}" },
        vars: { SLACK_TOKEN: "xoxb-actual-secret" },
      },
      {
        method: "GET",
        pathTemplate: "/x",
        headers: {},
        query: {},
        bodyTemplate: null,
        timeoutMs: 5000,
      },
      {},
    );
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer xoxb-actual-secret");
  });

  it("renders {{ vars.X }} in path, query, and body templates too", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await runCustomAction(
      {
        name: "test",
        baseUrl: "https://api.example.com",
        defaultHeaders: {},
        vars: { ACCOUNT_ID: "acct_123" },
      },
      {
        method: "POST",
        pathTemplate: "/accounts/{{ vars.ACCOUNT_ID }}/items",
        headers: {},
        query: { account: "{{ vars.ACCOUNT_ID }}" },
        bodyTemplate: { account: "{{ vars.ACCOUNT_ID }}", id: "{{ id }}" },
        timeoutMs: 5000,
      },
      { id: "abc" },
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect((url as URL).pathname).toBe("/accounts/acct_123/items");
    expect((url as URL).searchParams.get("account")).toBe("acct_123");
    expect((init as RequestInit).body).toBe(
      JSON.stringify({ account: "acct_123", id: "abc" }),
    );
  });

  it("preserves an explicit Content-Type header set on the function", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await runCustomAction(
      { name: "test", baseUrl: null, defaultHeaders: {} },
      {
        method: "POST",
        pathTemplate: "https://api.example.com/x",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        query: {},
        bodyTemplate: { hi: "there" },
        timeoutMs: 5000,
      },
      {},
    );
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });
});
