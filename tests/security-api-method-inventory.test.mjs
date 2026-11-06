import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  extractApiMethods,
  directGuardEvidenceRegressions,
  inventoryApi,
} from "../scripts/security/api-method-inventory.mjs";

test("a GET authentication call never counts for a separate unguarded POST", () => {
  const methods = extractApiMethods(`
    import { getCurrentRequestContext } from "@/auth/request-context";
    import { isSameOriginRequest } from "@/auth/origin";
    export async function GET() {
      await getCurrentRequestContext();
      return new Response("yes");
    }
    export async function POST(request: Request) {
      // getCurrentRequestContext(); is just a comment, not a guard.
      const text = "isSameOriginRequest(request)";
      return new Response(text);
    }
  `);
  assert.deepEqual(methods.map(m => m.method), ["GET", "POST"]);
  assert.equal(methods[0].has_direct_session_evidence, true);
  assert.equal(methods[1].has_direct_session_evidence, false);
  assert.equal(methods[1].has_direct_origin_evidence, false);
  assert.equal(methods[1].review_status, "UNREVIEWED");
});

test("exported variable handlers and named reexports are inventoried", () => {
  const methods = extractApiMethods(`
    export const PATCH = async (request: Request) => {
      await getCurrentRequestContext();
      requirePermission(actor, "people.manage", { collegeId: "x" });
      if (!isSameOriginRequest(request)) throw Error();
    };
    export { actualDelete as DELETE };
  `);
  assert.deepEqual(methods.map(m => m.method), ["DELETE", "PATCH"]);
  const patch = methods.find(m => m.method === "PATCH");
  assert.equal(patch.has_direct_session_evidence, true);
  assert.equal(patch.has_direct_permission_evidence, true);
  assert.equal(patch.has_direct_origin_evidence, true);
  assert.equal(methods.find(m => m.method === "DELETE").implementation, "reexport");
  assert.equal(methods.find(m => m.method === "DELETE").has_direct_permission_evidence, false);
});

test("one route is not counted as reviewed merely because it exports GET", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-method-security-"));
  try {
    const route = path.join(dir, "tenant", "route.ts");
    fs.mkdirSync(path.dirname(route), { recursive: true });
    fs.writeFileSync(route, `
      export async function GET() { return Response.json({ ok: true }); }
      export async function POST() { return Response.json({ ok: true }); }
    `);
    const report = inventoryApi(dir);
    assert.equal(report.summary.route_files, 1);
    assert.equal(report.summary.exported_methods, 2);
    assert.equal(report.summary.unreviewed_methods, 2);
    assert.equal(report.summary.unsafe_methods_without_direct_origin_evidence, 1);
    assert.equal(report.summary.methods_without_direct_session_evidence, 2);
    assert.deepEqual(report.methods.map(m => m.route), ["/api/tenant", "/api/tenant"]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("unsupported handler export names cannot silently become security evidence", () => {
  const methods = extractApiMethods(`
    export const handlers = { GET: () => {} };
    export const runtime = "nodejs";
    export function HEAD() {}
  `);
  assert.deepEqual(methods.map(m => m.method), ["HEAD"]);
});

test("legacy method guard removal is detected independently per HTTP verb", () => {
  const before = `
    export async function GET() {
      await getCurrentRequestContext();
      return Response.json({ ok: true });
    }
    export async function POST(request) {
      await getCurrentRequestContext();
      if (!isSameOriginRequest(request)) return new Response(null, { status: 403 });
      requirePermission(actor, "people.manage", { collegeId: "a" });
      return Response.json({ ok: true });
    }
  `;
  const after = `
    export async function GET() {
      await getCurrentRequestContext();
      return Response.json({ ok: true });
    }
    export async function POST(request) {
      await getCurrentRequestContext();
      return Response.json({ ok: true });
    }
  `;
  assert.deepEqual(directGuardEvidenceRegressions(before, after), [
    { method: "POST", reason: "DIRECT_ORIGIN_EVIDENCE_REMOVED" },
    { method: "POST", reason: "DIRECT_PERMISSION_EVIDENCE_REMOVED" },
  ]);
});

test("removing session evidence is detected without treating new methods as regressions", () => {
  const before = `export async function GET() {
    await getCurrentRequestContext();
    return Response.json({});
  }`;
  const after = `
    export async function GET() { return Response.json({}); }
    export async function POST() { return Response.json({}); }
  `;
  assert.deepEqual(directGuardEvidenceRegressions(before, after), [
    { method: "GET", reason: "DIRECT_SESSION_EVIDENCE_REMOVED" },
  ]);
});

test("no guard evidence loss when a handler retains or strengthens its checks", () => {
  const before = `export async function POST() {
    if (!isSameOriginRequest(request)) return new Response(null, { status: 403 });
  }`;
  const after = `export async function POST() {
    await getCurrentRequestContext();
    if (!isSameOriginRequest(request)) return new Response(null, { status: 403 });
    requirePermission(actor, "courses.manage", { collegeId: "a" });
  }`;
  assert.deepEqual(directGuardEvidenceRegressions(before, after), []);
});

test("central wrappers count as guard evidence only when they really guard", () => {
  const evidence = (source) => extractApiMethods(source)[0];
  const user = evidence(`export const POST = route({ auth: "user", permission: "x.y" }, async () => Response.json({}));`);
  assert.equal(user.has_direct_session_evidence, true);
  assert.equal(user.has_direct_origin_evidence, true);
  // Public routes (either quote style), non-literal auth, and a method named route() on another object are not guards.
  for (const source of [
    `export const GET = route({ auth: 'public', permission: "service-enforced" }, async () => Response.json({}));`,
    `export const GET = route({ auth: AUTH, permission: "service-enforced" }, async () => Response.json({}));`,
    `export const GET = router.route({ auth: "user" }, async () => Response.json({}));`,
    `export const POST = webhookRoute({ name: "x" }, async () => Response.json({}));`,
  ]) {
    const m = evidence(source);
    assert.equal(m.has_direct_session_evidence, false, source);
    assert.equal(m.has_direct_origin_evidence, false, source);
  }
});

test("an Origin rejection must be a real condition, not a comment, string or bare read", () => {
  const origin = (body) => extractApiMethods(`export async function POST(request: Request) { ${body} return new Response("ok"); }`)[0].has_direct_origin_evidence;
  assert.equal(origin(`if (request.headers.has("origin")) return new Response("no", { status: 403 });`), true);
  assert.equal(origin(`// if (request.headers.has("origin")) reject`), false);
  assert.equal(origin(`const t = 'request.headers.has("origin")';`), false);
  assert.equal(origin(`const o = request.headers.get("origin");`), false);
});
