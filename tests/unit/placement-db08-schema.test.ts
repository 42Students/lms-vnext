import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  placementBatches,
  placementRegistrations,
  placementDebarments,
  placementDebarmentDriveEvents,
  placementExternalOutcomes,
  placementSavedJobs,
  placementEligibilityActions,
  placementEligibilityEvents,
  placementEligibilityDecisions,
} from "@/db/schema";

describe("DB08 proposed relational tables (schema declaration only)", () => {
  it("names every newly modeled product concept separately", () => {
    const tables = [
      placementBatches,
      placementRegistrations,
      placementDebarments,
      placementDebarmentDriveEvents,
      placementExternalOutcomes,
      placementSavedJobs,
      placementEligibilityActions,
      placementEligibilityEvents,
      placementEligibilityDecisions,
    ];
    const names = tables.map(getTableName);
    expect(names).toEqual([
      "placement_batches",
      "placement_registrations",
      "placement_debarments",
      "placement_debarment_drive_events",
      "placement_external_outcomes",
      "placement_saved_jobs",
      "placement_eligibility_actions",
      "placement_eligibility_events",
      "placement_eligibility_decisions",
    ]);
    expect(new Set(names).size).toBe(tables.length);
  });
});
