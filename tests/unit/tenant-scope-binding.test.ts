import { describe, expect, it } from "vitest";
import { z } from "zod";
import { bindTenantScope, currentTenantScope, runWithTenantHolder, runWithTenantScope } from "@/db/tenant-context";
import { createInternalRoute } from "@/security/internal-route-core";
import { createWebhookRoute, signWebhook } from "@/security/webhook-route-core";
import { runAsSystem } from "@/db/tenant-context";

const scope = (userId: string) => ({ userId, collegeId: "c1", role: "COLLEGE_ADMIN", platform: false });

describe("tenant scope binding outside API routes", () => {
  it("binds into a wrapper holder once and never replaces it", () => {
    runWithTenantHolder(() => {
      bindTenantScope(scope("first"));
      bindTenantScope(scope("second"));
      expect(currentTenantScope()?.userId).toBe("first");
    });
  });

  it("an explicit scope wins over a later bind", () => {
    runWithTenantScope(scope("explicit"), () => {
      bindTenantScope(scope("late"));
      expect(currentTenantScope()?.userId).toBe("explicit");
    });
  });

  it("a server component with no holder keeps the actor for the rest of its async chain", async () => {
    await new Promise<void>((resolve, reject) => {
      // A fresh async context stands in for one server-component render.
      setImmediate(async () => {
        try {
          expect(currentTenantScope()).toBeUndefined();
          bindTenantScope(scope("page"));
          await Promise.resolve();
          expect(currentTenantScope()?.userId).toBe("page");
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});

describe("machine routes run inside a named system scope", () => {
  it("internal routes", async () => {
    const SECRET = "s".repeat(40);
    const internalRoute = createInternalRoute({
      readSecret: () => SECRET,
      readJson: async () => ({ kind: "OK", value: {} }),
      onError: () => Response.json({}, { status: 500 }),
      newRequestId: () => "rid",
      runInSystemScope: runAsSystem,
    } as never);
    let seen: unknown;
    const res = await internalRoute(
      { name: "internal.job", credential: { kind: "header", header: "x-key", secretEnv: "E" } },
      async () => {
        seen = currentTenantScope();
        return Response.json({ ok: true });
      },
    )(new Request("https://a.test/api/internal/x", { method: "POST", headers: { "x-key": SECRET } }));
    expect(res.status).toBe(200);
    expect(seen).toMatchObject({ system: "internal:internal.job", userId: null });
  });

  it("webhooks", async () => {
    const SECRET = "w".repeat(40);
    const raw = JSON.stringify({ id: 1 });
    const webhookRoute = createWebhookRoute({
      readSecret: () => SECRET,
      readRaw: async (r: Request) => ({ kind: "OK", text: await r.clone().text() }),
      claimDelivery: async () => true,
      now: () => 1,
      onError: () => Response.json({}, { status: 500 }),
      newRequestId: () => "rid",
      runInSystemScope: runAsSystem,
    } as never);
    let seen: unknown;
    const res = await webhookRoute(
      { name: "wh", auth: { kind: "hmac", header: "x-sig", secretEnv: "E" }, body: { schema: z.object({ id: z.number() }), maxBytes: 100 } },
      async () => {
        seen = currentTenantScope();
        return Response.json({ ok: true });
      },
    )(new Request("https://a.test/api/webhooks/x", { method: "POST", headers: { "x-sig": signWebhook(SECRET, raw) }, body: raw }));
    expect(res.status).toBe(200);
    expect(seen).toMatchObject({ system: "webhook:wh" });
  });
});
