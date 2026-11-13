import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs script without type declarations
import { BASELINE, METRICS, compare, computeCounts, countMetric, duplicatedNameCount } from "../../scripts/centralisation-metrics.mjs";

type Source = { path: string; text: string };
const src = (path: string, text: string): Source => ({ path, text });

describe("centralisation metrics", () => {
  const byId = (id: string) => METRICS.find((m: { id: string }) => m.id === id)!;

  it("counts occurrences within the metric's scope only", () => {
    const sources = [
      src("src/app/api/a/route.ts", 'permission: "service-enforced"\npermission: "service-enforced"'),
      src("src/modules/x.ts", 'permission: "service-enforced"'), // outside src/app/api: not counted
    ];
    expect(countMetric(byId("authz.serviceEnforcedRoutes"), sources)).toBe(2);
  });

  it('"files" metrics count a file once however many matches it has', () => {
    const sources = [
      src("src/app/api/a/route.ts", 'import { getDb } from "@/db/client";\ngetDb();getDb();'),
      src("src/app/api/b/route.ts", "export const x = 1;"),
    ];
    expect(countMetric(byId("data.directDbRoutes"), sources)).toBe(1);
  });

  it("excludes the central module itself from its own metric", () => {
    const sources = [
      src("src/config/locale.ts", 'timeZone: "Asia/Kolkata"'),
      src("src/components/x.tsx", 'timeZone: "Asia/Kolkata"'),
    ];
    expect(countMetric(byId("time.asiaKolkataLiterals"), sources)).toBe(1);
  });

  it("finds names defined in four or more files", () => {
    const sources = ["a", "b", "c", "d"].map((n) => src(`src/lib/${n}.ts`, "export function humanize(v: string) { return v; }"));
    sources.push(src("src/lib/e.ts", "export function onlyHere() {}"));
    expect(duplicatedNameCount(sources)).toBe(1);
  });

  it("only enforced metrics can fail the ratchet", () => {
    const baseline = { counts: { "a.one": 5, "a.two": 5 } };
    const counts = { "a.one": 6, "a.two": 9 };
    expect(compare(counts, baseline, new Set(["a.one"]))).toEqual([{ id: "a.one", before: 5, now: 6 }]);
    expect(compare(counts, baseline, new Set())).toEqual([]);
    expect(compare({ "a.one": 4, "a.two": 5 }, baseline, new Set(["a.one", "a.two"]))).toEqual([]);
  });

  it("the committed baseline covers every metric", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as { counts: Record<string, number> };
    const ids = [...METRICS.map((m: { id: string }) => m.id), "helpers.duplicatedNames"];
    expect(ids.filter((id) => baseline.counts[id] === undefined)).toEqual([]);
  });

  it("computeCounts returns every metric id", () => {
    const counts = computeCounts([]);
    expect(Object.keys(counts).length).toBe(METRICS.length + 1);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });
});
