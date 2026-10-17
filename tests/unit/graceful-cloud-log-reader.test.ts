import { describe, expect, it, vi } from "vitest";
import {
  boundedCloudJsonRequest, buildCloudErrorFilter, cloudLoggingAccessToken, parseCloudErrorEntry, readCloudLogErrorPage, readCloudProviderJsonLimited,
} from "@/modules/log-alerts/cloud-log-reader";

describe("GR-114 GR-118 Cloud Logging fallback", () => {
  it("GR-118 filters one namespace/container and a bounded timestamp window", () => {
    const filter = buildCloudErrorFilter(
      new Date("2099-04-01T00:00:00Z"), new Date("2099-04-01T00:02:00Z"), "lms-dev-2026",
    );
    expect(filter).toContain('resource.labels.namespace_name="lms-dev-2026"');
    expect(filter).toContain('resource.labels.container_name="web"');
    expect(filter).toContain("severity>=ERROR");
    expect(filter).not.toContain("other-tenant");
    expect(() => buildCloudErrorFilter(new Date("2099-04-01"), new Date("2099-04-02"), 'bad" OR severity>=DEBUG')).toThrow();
  });
  it("GR-113 GR-125 parses ERROR entries without forwarding PII or raw stacks", () => {
    const e = parseCloudErrorEntry({
      insertId: "abc", logName: "projects/safe/logs/stdout",
      timestamp: "2099-04-01T00:00:00Z",
      jsonPayload: {
        event: "api.unhandled_error",
        message: "Failed for jane@example.com password=secret\n at /node_modules/secret.js",
        path: "/api/users/jane@example.com", requestId: "abcdefgh",
      },
    });
    expect(e?.message).not.toContain("jane@example.com");
    expect(e?.message).not.toContain("node_modules");
    expect(e?.path).toBe("/api/users/[id]");
    expect(e?.id).toBe("projects/safe/logs/stdout:abc");
    expect(e?.requestId).toBeUndefined();
  });
  it("GR-112 GR-114 aligns structured stack headers with in-process error signatures", () => {
    const e = parseCloudErrorEntry({
      insertId: "stack-one",
      logName: "projects/test/logs/stderr",
      timestamp: "2099-04-01T00:00:02Z",
      jsonPayload: { message: "TypeError: connection refused\n  at node_modules/example.js" },
    });
    expect(e?.message).toBe("connection refused");
  });
  it("GR-118 never accepts an arbitrary project, injected filter or untrusted credential", async () => {
    await expect(readCloudLogErrorPage({
      project: "untrusted/project", namespace: "lms-dev-2026",
      start: new Date("2099-04-01T00:00:00Z"), end: new Date("2099-04-01T00:02:00Z"),
      token: "synthetic",
      transport: (async () => { throw new Error("transport should not be called"); }) as typeof fetch,
    })).rejects.toThrow("INVALID_LOG_CONFIGURATION");
  });
  it("GR-113 GR-118 GR-125 rejects oversized provider bodies while streaming", async () => {
    const chunks = [new Uint8Array(750_000), new Uint8Array(300_000)];
    const response = new Response(new ReadableStream<Uint8Array>({
      pull(controller) {
        const next = chunks.shift();
        if (next) controller.enqueue(next);
        else controller.close();
      },
    }));
    await expect(readCloudProviderJsonLimited(response))
      .rejects.toThrow("LOG_PROVIDER_RESPONSE_TOO_LARGE");
  });
  it("GR-118 GR-125 enforces a timeout while provider response body is still streaming", async () => {
    const stalled = new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"entries":'));
      },
    }));
    await expect(boundedCloudJsonRequest(
      "https://logging.googleapis.com/v2/entries:list",
      { method: "POST" },
      (async () => stalled) as typeof fetch,
      20,
    )).rejects.toThrow("LOG_PROVIDER_UNAVAILABLE");
    // Cancellation is propagated to the locked response reader on timeout.
  });
  it("GR-118 rejects malformed provider JSON without echoing the provider response", async () => {
    await expect(readCloudProviderJsonLimited(new Response("not-json")))
      .rejects.toThrow("LOG_PROVIDER_INVALID_RESPONSE");
  });
  it("GR-118 treats an expired Cloud Logging page token as a safe retry signal", async () => {
    await expect(readCloudLogErrorPage({
      project: "lms-vnext-1234", namespace: "lms-dev-2026",
      start: new Date("2099-04-01T00:00:00Z"), end: new Date("2099-04-01T00:02:00Z"),
      token: "synthetic", pageToken: "expired",
      transport: (async () => new Response("bad page", { status: 400 })) as typeof fetch,
    })).rejects.toThrow("LOG_PROVIDER_CURSOR_EXPIRED");
  });
  it("GR-125 uses metadata ADC without leaking the access token on failures", async () => {
    const access = await cloudLoggingAccessToken(vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "synthetic-access-value" }), { status: 200 })) as typeof fetch);
    expect(access).toBe("synthetic-access-value");
    const transport = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer synthetic-access-value");
      const body = JSON.parse(String(init?.body)) as { pageSize: number; filter: string };
      expect(body.pageSize).toBe(12);
      expect(body.filter).toContain("severity>=ERROR");
      return Response.json({
        entries: [{
          insertId: "one", logName: "projects/test/logs/stdout",
          timestamp: "2099-04-01T00:00:01Z", textPayload: "One failure",
        }],
        nextPageToken: "next",
      });
    });
    const result = await readCloudLogErrorPage({
      project: "lms-vnext-1234", namespace: "lms-dev-2026",
      start: new Date("2099-04-01T00:00:00Z"), end: new Date("2099-04-01T00:02:00Z"),
      token: access, transport: transport as typeof fetch,
    });
    expect(result.errors).toHaveLength(1);
    expect(result.nextPageToken).toBe("next");
    await expect(readCloudLogErrorPage({
      project: "lms-vnext-1234", namespace: "lms-dev-2026",
      start: new Date("2099-04-01T00:00:00Z"), end: new Date("2099-04-01T00:02:00Z"),
      token: access,
      transport: (async () => { throw new Error("secret synthetic-access-value"); }) as typeof fetch,
    })).rejects.toThrow("LOG_PROVIDER_UNAVAILABLE");
  });
});
