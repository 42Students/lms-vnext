import { describe, expect, it } from "vitest";
import { createAnomalyDetector } from "@/security/anomaly";

describe("audit anomaly detector (SEC-19)", () => {
  it("flags the 20th denial of one user inside five minutes exactly once", () => {
    let t = 0;
    const observe = createAnomalyDetector(undefined, () => t);
    const denied = { event: "api.denied", outcome: "denied", userId: "u1" };
    let findings = 0;
    for (let i = 0; i < 40; i++) {
      t += 1_000;
      findings += observe(denied).length;
    }
    expect(findings).toBe(1);
  });
  it("starts a new window after it expires and keeps users separate", () => {
    let t = 0;
    const observe = createAnomalyDetector(undefined, () => t);
    for (let i = 0; i < 19; i++) observe({ event: "api.denied", outcome: "denied", userId: "u1" });
    for (let i = 0; i < 19; i++) expect(observe({ event: "api.denied", outcome: "denied", userId: "u2" })).toHaveLength(0);
    t += 6 * 60_000;
    expect(observe({ event: "api.denied", outcome: "denied", userId: "u1" })).toHaveLength(0);
  });
  it("flags login probing per client tag and bulk export per user", () => {
    const observe = createAnomalyDetector();
    let probing = 0;
    for (let i = 0; i < 10; i++) probing += observe({ event: "auth.login_rejected", outcome: "denied", ipTag: "abc" }).length;
    expect(probing).toBe(1);
    let exports = 0;
    for (let i = 0; i < 10; i++) exports += observe({ event: "api.export", outcome: "ok", userId: "u9" }).length;
    expect(exports).toBe(1);
  });
  it("ignores events no rule counts", () => {
    const observe = createAnomalyDetector();
    for (let i = 0; i < 100; i++) expect(observe({ event: "api.mutation", outcome: "ok", userId: "u1" })).toHaveLength(0);
  });
});

describe("object enumeration rule", () => {
  it("flags thirty not-found answers for one user in five minutes once", () => {
    const observe = createAnomalyDetector();
    let findings = 0;
    for (let i = 0; i < 60; i++) findings += observe({ event: "api.not_found", outcome: "not_found", userId: "u3" }).filter((f) => f.rule === "object_enumeration").length;
    expect(findings).toBe(1);
  });
});
