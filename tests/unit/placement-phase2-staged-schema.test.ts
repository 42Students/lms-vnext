import { describe, expect, it } from "vitest";
import { getColumnName } from "drizzle-orm";
import {
  proposedPlacementJobIsDream,
  proposedPlacementCascadeId,
} from "@/modules/placements/placement-phase2-staged-schema";

describe("P-S1-05 P-S1-06 staged schema only", () => {
  it("declares required future metadata without registering production schema", () => {
    expect(getColumnName(proposedPlacementJobIsDream)).toBe("is_dream");
    expect(getColumnName(proposedPlacementCascadeId)).toBe("cascade_id");
  });
});
