import { describe, expect, it } from "vitest";
import {
  parseLearnerFamilyVerification,
  parseLearnerSurfaceLedger,
} from "../../scripts/learner-surface-status";

describe("learner no-surprise parity status", () => {
  it("keeps stale family evidence separate from historically closed rows", () => {
    const surfaces = parseLearnerSurfaceLedger(
      "| L0-001 | Sidebar | old | new | CLOSED |\n",
    );
    const families = parseLearnerFamilyVerification(
      "| L0 | Shell/navigation | STALE | — | — | — | pending | pending | pending | pending | pending | drift |\n",
    );

    expect(surfaces.resolved).toBe(1);
    expect(surfaces.unresolved).toBe(0);
    expect(families.verified).toBe(0);
    expect(families.counts.STALE).toBe(1);
  });
});
