import { describe, expect, it } from "vitest";
import { handlerBody, read, rel, routeFiles } from "./phase3-scan-helpers";

/**
 * GET must never write: browsers, link scanners and prefetchers fire GETs
 * without user intent and without CSRF protection. A Drizzle write chain
 * (also inside a transaction) or an activity-event write in a GET handler
 * fails here. Read-only transactions used for persisted permission checks
 * are allowed because they contain no write call.
 */
const WRITE_PATTERNS: Array<[string, RegExp]> = [
  ["drizzle insert", /\.\s*insert\(\s*[A-Za-z_]/],
  ["drizzle update chain", /\.\s*update\(\s*[A-Za-z_][\w.]*\s*\)\s*\.\s*set\(/],
  ["drizzle delete chain", /\.\s*delete\(\s*[A-Za-z_][\w.]*\s*\)\s*\.\s*where\(/],
  ["activity event write", /recordActivityEvent(?:InTransaction)?\(/],
];

/** Routes whose GET intentionally has a write-shaped call; each needs a reason. */
const ALLOWED_GET_WRITES: Record<string, string> = {};

describe("Phase 3: no API GET handler performs a write", () => {
  const routes = routeFiles("src/app/api").map((p) => ({ file: rel(p), src: read(p) }));

  it("scans the whole API tree", () => {
    expect(routes.length).toBeGreaterThan(800);
    expect(routes.filter((r) => handlerBody(r.src, "GET") !== null).length).toBeGreaterThan(300);
  });

  it("no GET handler contains a database write or activity-event write", () => {
    const offenders: string[] = [];
    for (const { file, src } of routes) {
      const body = handlerBody(src, "GET");
      if (!body || file in ALLOWED_GET_WRITES) continue;
      for (const [name, re] of WRITE_PATTERNS) {
        if (re.test(body)) offenders.push(`${file}: ${name}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the scanner's write patterns do not flag Map.delete or URLSearchParams.delete", () => {
    const harmless = `export async function GET(){ params.delete("format"); streams.delete(key); }`;
    for (const [, re] of WRITE_PATTERNS) expect(re.test(harmless)).toBe(false);
  });

  it("the scanner's write patterns do flag real Drizzle writes", () => {
    expect(WRITE_PATTERNS[0]![1].test("await db.insert(users).values(x)")).toBe(true);
    expect(WRITE_PATTERNS[1]![1].test("await db.update(users).set({a:1})")).toBe(true);
    expect(WRITE_PATTERNS[2]![1].test("await db.delete(users).where(eq(a,b))")).toBe(true);
  });

  it("the allow-list stays empty unless a reason is written", () => {
    for (const [file, reason] of Object.entries(ALLOWED_GET_WRITES)) {
      expect(reason.length, `${file} needs a written reason`).toBeGreaterThan(20);
    }
  });
});
