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
  // "src/app/api/example/route.ts POST": "authenticated by provider signature",
  "src/app/api/webhooks/telegram/route.ts POST":
    "Telegram provider webhook authenticates x-telegram-bot-api-secret-token through validTelegramWebhookSecret; no session cookie or browser Origin",
  "src/app/api/internal/placements/tpo/notices/deliver/route.ts POST":
    "scheduler endpoint; authenticated by the x-tpo-scheduler-key secret (timing-safe), no cookie",
  "src/app/api/internal/placements/tpo/withdrawal-escalations/run/route.ts POST":
    "scheduler endpoint; authenticated by the x-tpo-scheduler-key secret (timing-safe), no cookie",
};

/** GET handlers whose names look mutating but only read. Each needs a reason. */
const ALLOWED_GET: Record<string, string> = {
  "src/app/api/courses/assignment-submissions/[submissionId]/file/route.ts GET":
    "createAssignmentFileReadGrant issues a short-lived read grant; no state change",
  "src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts GET":
    "file.createReadStream streams bytes; no state change",
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
    expect(source).toContain("if (process.env.APP_ENV !== \"production\")");
    expect(source).not.toContain("getCurrentRequestContext");
  });

  it("every POST/PUT/PATCH/DELETE handler checks the request origin", () => {
    const unguarded: string[] = [];

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const { method, body } of handlers(source)) {
        if (method === "GET") continue;
        const id = `${path.relative(process.cwd(), file).replace(/\\/g, "/")} ${method}`;
        if (!GUARD.test(body) && !ALLOWED[id]) unguarded.push(id);
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
