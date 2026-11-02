import { describe, expect, it, vi } from "vitest";
import { exportedMethods, hopSources, read, rel, routeFiles } from "./phase3-scan-helpers";

vi.setConfig({ testTimeout: 60_000 });

/**
 * Super Admin mutations must reject unexpected fields: a body read from the
 * request has to reach a schema parse, and the schemas on the path must use
 * z.strictObject / .strict() so caller-injected fields (role, organizationId,
 * privileges) are refused instead of silently dropped.
 */
const MUTATING_ADMIN = routeFiles("src/app/api/admin")
  .map((abs) => ({ abs, file: rel(abs), src: read(abs), methods: exportedMethods(read(abs)) }))
  .filter((r) => r.methods.some((m) => m !== "GET"));

const STRICT = /z\.strictObject\(|\.strict\(\)/;
const PARSE = /\.(?:safeParse|parse)\(/;

/** Routes with no body to validate (path parameters only) or a reasoned exception. */
const EXEMPT: Record<string, string> = {};

describe("Phase 3: Super Admin mutations validate and reject unexpected input", () => {
  it("finds the mutating admin routes", () => {
    expect(MUTATING_ADMIN.length).toBeGreaterThanOrEqual(45);
  });

  it("every mutating admin route reaches a strict schema within three hops", () => {
    const loose = MUTATING_ADMIN.filter(({ abs, file }) => !(file in EXEMPT) && !STRICT.test(hopSources(abs, 3))).map(
      (r) => r.file,
    );
    expect(loose, `mutating admin routes without a strict schema: ${loose.join(", ")}`).toEqual([]);
  });

  it("every route that reads a JSON body reaches a schema parse within three hops", () => {
    const unvalidated = MUTATING_ADMIN.filter(
      ({ abs, src }) => /request\.json\(\)|req\.json\(\)/.test(src) && !PARSE.test(hopSources(abs, 3)),
    ).map((r) => r.file);
    expect(unvalidated, `JSON body never parsed: ${unvalidated.join(", ")}`).toEqual([]);
  });

  it("no mutating admin route spreads the raw body into a service call", () => {
    const spreads = MUTATING_ADMIN.filter(({ src }) => /\.\.\.\s*\(?\s*(?:await\s+)?request\.json\(\)/.test(src)).map(
      (r) => r.file,
    );
    expect(spreads, `raw body spread: ${spreads.join(", ")}`).toEqual([]);
  });

  it("the detectors recognise strict schemas and reject permissive ones", () => {
    expect(STRICT.test("const s=z.strictObject({a:z.string()})")).toBe(true);
    expect(STRICT.test("z.object({a:z.string()}).strict()")).toBe(true);
    expect(STRICT.test("z.object({a:z.string()})")).toBe(false);
    expect(PARSE.test("schema.safeParse(raw)")).toBe(true);
    expect(PARSE.test("JSON.parse(text)")).toBe(true);
  });

  it("every exemption has a written reason and names an existing route", () => {
    for (const [file, reason] of Object.entries(EXEMPT)) {
      expect(reason.length, `${file} needs a reason`).toBeGreaterThan(20);
      expect(MUTATING_ADMIN.some((r) => r.file === file)).toBe(true);
    }
  });
});
