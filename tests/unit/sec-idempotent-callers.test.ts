import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAttemptKeys } from "@/lib/action-idempotency";

const read = (file: string) => readFileSync(file, "utf8");

describe("attempt keys", () => {
  it("reuses the key until the server has answered, then issues a new one", () => {
    const attempt = createAttemptKeys();
    const first = attempt.next();
    expect(attempt.next()).toBe(first);
    attempt.settle();
    const second = attempt.next();
    expect(second).not.toBe(first);
    expect(second).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });
});

describe("routes that require an Idempotency-Key", () => {
  const routes: Array<[string, string[]]> = [
    ["src/app/api/placements/jobs/[jobId]/applications/route.ts", ["src/components/placements/learner-placement-jobs.tsx"]],
    ["src/app/api/placements/offers/[offerId]/actions/route.ts", ["src/components/placements/learner-placement-offers.tsx", "src/components/placements/placement-offer-controls.tsx"]],
  ];
  for (const [routeFile, callers] of routes) {
    it(`${routeFile} is idempotent and every caller sends a key`, () => {
      expect(read(routeFile)).toMatch(/idempotent: true/);
      for (const caller of callers) expect(read(caller), caller).toMatch(/Idempotency-Key/);
    });
  }
});
