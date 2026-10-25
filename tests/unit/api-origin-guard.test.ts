import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every state-changing API handler (POST, PUT, PATCH, DELETE) must reject
 * cross-origin requests, because the session cookie is sent automatically by
 * browsers. This test walks every route file so a new route cannot ship
 * without the guard.
 *
 * Accepted guards:
 *  - isSameOriginRequest(request)      direct check
 *  - guardLoginRequest(...)            wraps the same check for sign-in routes
 *
 * Add a route to ALLOWED only with a written reason (for example a webhook
 * that authenticates with its own signature instead of a cookie).
 */
const ALLOWED: Record<string, string> = {
  "src/app/api/internal/inbound-mail/route.ts POST":
    "Inbound mail provider uses signed x-inbound-mail-signature, verified by ingestVerifiedInboundMail; no browser session.",
  "src/app/api/internal/notifications/release/route.ts POST":
    "Scheduler-only bearer token with timingSafeEqual; no browser session or Origin header.",
  "src/app/api/internal/mentor-project-email-dispatch/route.ts POST":
    "Mentor email worker uses an independent rotated bearer secret, strict length guard and timingSafeEqual; no browser session.",

  // "src/app/api/example/route.ts POST": "authenticated by provider signature",
  "src/app/api/internal/alerts/tick/route.ts POST":
    "secret-authenticated scheduler with timing-safe x-internal-alerts-key verification and no browser session cookie; Origin is not available for scheduled callers",
  "src/app/api/webhooks/telegram/route.ts POST":
    "Telegram provider webhook authenticates x-telegram-bot-api-secret-token through validTelegramWebhookSecret; no session cookie or browser Origin",
  "src/app/api/internal/placements/tpo/notices/deliver/route.ts POST":
    "scheduler endpoint; authenticated by the x-tpo-scheduler-key secret (timing-safe), no cookie",
  "src/app/api/internal/placements/tpo/withdrawal-escalations/run/route.ts POST":
    "scheduler endpoint; authenticated by the x-tpo-scheduler-key secret (timing-safe), no cookie",
};

/** Compatibility aliases are allowed only when their verified delegate
 * performs the same-origin check before every mutation. The scan below reads
 * each delegate, so removing its security guard breaks this test. */
const DELEGATED_ORIGIN: Record<string,{call:string;owner:string;guard:RegExp}> = {
  "src/app/api/admin/colleges/[collegeId]/subdomain/route.ts POST":{
    call:"mutate(request,params)",owner:"src/app/api/admin/colleges/[collegeId]/subdomain/route.ts",
    guard:/async function mutate[\s\S]*?isSameOriginRequest\(request\)/,
  },
  "src/app/api/admin/colleges/[collegeId]/subdomain/route.ts PUT":{
    call:'mutate(request,params,"PUT")',owner:"src/app/api/admin/colleges/[collegeId]/subdomain/route.ts",
    guard:/async function mutate[\s\S]*?isSameOriginRequest\(request\)/,
  },
  "src/app/api/admin/colleges/[collegeId]/subdomain/route.ts DELETE":{
    call:'mutate(request,params,"DELETE")',owner:"src/app/api/admin/colleges/[collegeId]/subdomain/route.ts",
    guard:/async function mutate[\s\S]*?isSameOriginRequest\(request\)/,
  },
  "src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts POST":{
    call:"PATCH(request,context)",owner:"src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts",
    guard:/export async function PATCH[\s\S]*?isSameOriginRequest\(request\)/,
  },
  "src/app/api/auth/legacy/otp/start/route.ts POST":{
    call:"startScopedLogin(adapted)",owner:"src/app/api/auth/login/start/route.ts",
    guard:/export async function POST[\s\S]*?guardLoginRequest\(\s*request/,
  },
  "src/app/api/auth/session/route.ts POST":{
    call:"DELETE(request)",owner:"src/app/api/auth/session/route.ts",
    guard:/export async function DELETE[\s\S]*?isSameOriginRequest\(request\)/,
  },
  "src/app/api/college/batches/[cohortId]/route.ts PUT":{
    call:"PATCH(request,route)",owner:"src/app/api/college/batches/[cohortId]/route.ts",
    guard:/export async function PATCH[\s\S]*?isSameOriginRequest\(request\)/,
  },
};

/** GET handlers whose names look mutating but only read. Each needs a reason. */
const ALLOWED_GET: Record<string, string> = {
  "src/app/api/courses/assignment-submissions/[submissionId]/file/route.ts GET":
    "createAssignmentFileReadGrant issues a short-lived read grant; no state change",
  "src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts GET":
    "file.createReadStream streams bytes; no state change",
  "src/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/resources/[resourceId]/url/route.ts GET":
    "createLearnerAssignmentResourceReadGrant signs a scoped private read URL; no mutation",
  "src/app/api/notifications/stream/route.ts GET":
    "stream teardown deletes only an in-memory connection counter, not persisted data",
  "src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts GET":
    "helper updateOverride follows the GET handler but is called only by POST and PUT",
  "src/app/api/placements/learner/jobs/[jobId]/job-description/route.ts GET":
    "createPrivateReadGrant issues a bounded private download URL with no persisted write",
};

const GUARD = /isSameOriginRequest|guardLoginRequest/;
const ROOT = path.join(process.cwd(), "src/app");

function routeFiles(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) routeFiles(full, out);
    else if (entry.name === "route.ts") out.push(full);
  }
  return out;
}

function handlers(source: string) {
  const found: { method: string; body: string }[] = [];
  const pattern =
    /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;
  const marks = [...source.matchAll(pattern)];
  marks.forEach((match, index) => {
    const end = marks[index + 1]?.index ?? source.length;
    found.push({
      method: match[1],
      body: source.slice(match.index ?? 0, end),
    });
  });
  return found;
}

describe("state-changing API routes", () => {
  const files = routeFiles(ROOT);

  it("finds the route files (guards against a broken scan)", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("api-origin-guard telegram webhook accepts only the provider secret without a browser session",()=>{
    const file=path.join(ROOT,"api/webhooks/telegram/route.ts");
    const source=fs.readFileSync(file,"utf8");
    expect(ALLOWED["src/app/api/webhooks/telegram/route.ts POST"]).toContain("provider webhook");
    expect(source).toContain('validTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))');
    expect(source).toContain('process.env["APP_ENV"] !== "production"');
    expect(source).not.toContain("getCurrentRequestContext");
  });

  it("api-origin-guard scheduler exception requires a timing-safe secret and fails closed",()=>{
    const file=path.join(ROOT,"api/internal/alerts/tick/route.ts");
    const source=fs.readFileSync(file,"utf8");
    expect(ALLOWED["src/app/api/internal/alerts/tick/route.ts POST"]).toContain("timing-safe");
    expect(source).toContain('timingSafeEqual');
    expect(source).toContain('x-internal-alerts-key');
    expect(source).toContain('process.env["INTERNAL_ALERT_TICK_SECRET"]');
    expect(source).toContain('if (!provided || !expected) return false;');
    expect(source).not.toContain('getCurrentRequestContext');
  });

  it("origin exceptions use independent non-cookie authentication",()=>{
    const inbound=fs.readFileSync(path.join(ROOT,"api/internal/inbound-mail/route.ts"),"utf8");
    expect(inbound).toContain('request.headers.get("x-inbound-mail-signature")');
    expect(inbound).toContain("ingestVerifiedInboundMail(");
    expect(inbound).not.toContain("getCurrentRequestContext");
    const scheduler=fs.readFileSync(path.join(ROOT,"api/internal/notifications/release/route.ts"),"utf8");
    expect(scheduler).toContain("timingSafeEqual(actual, expected)");
    expect(scheduler).toContain("!secret || !incoming");
    expect(scheduler).not.toContain("getCurrentRequestContext");
    const mentorWorker=fs.readFileSync(path.join(ROOT,
      "api/internal/mentor-project-email-dispatch/route.ts"),"utf8");
    expect(mentorWorker).toContain('process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"]');
    expect(mentorWorker).toContain('expected.length<32');
    expect(mentorWorker).toContain('actual.startsWith("Bearer ")');
    expect(mentorWorker).toContain('timingSafeEqual(');
    expect(mentorWorker).not.toContain("getCurrentRequestContext");
  });

  it("every POST/PUT/PATCH/DELETE handler checks the request origin", () => {
    const unguarded: string[] = [];

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const { method, body } of handlers(source)) {
        if (method === "GET") continue;
        const id = `${path.relative(process.cwd(), file).replace(/\\/g, "/")} ${method}`;
        const delegated=DELEGATED_ORIGIN[id];
        const secureDelegate=delegated && body.includes(delegated.call) &&
          delegated.guard.test(fs.readFileSync(path.join(process.cwd(),delegated.owner),"utf8"));
        if (!GUARD.test(body) && !secureDelegate && !ALLOWED[id]) unguarded.push(id);
      }
    }

    expect(
      unguarded,
      `Handlers that change state without a same-origin check:\n${unguarded.join("\n")}`,
    ).toEqual([]);
  });

  it("GET handlers never write (no insert/update/delete service call by name)", () => {
    const suspicious: string[] = [];
    const writer =
      /\b(create|update|delete|remove|revoke|archive|suspend|reactivate|upsert|transition|onboard)[A-Z]\w*\(/;

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const { method, body } of handlers(source)) {
        if (method !== "GET") continue;
        const id = `${path.relative(process.cwd(), file).replace(/\\/g, "/")} GET`;
        if (writer.test(body) && !ALLOWED_GET[id]) suspicious.push(id);
      }
    }

    expect(
      suspicious,
      `GET handlers that appear to call a mutating service:\n${suspicious.join("\n")}`,
    ).toEqual([]);
  });
});
