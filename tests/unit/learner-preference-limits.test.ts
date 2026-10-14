import { describe, expect, it } from "vitest";
import { candidatePreferencesInputSchema } from "@/modules/placements/validation";

describe("learner placement preference limits", () => {
  it("accepts bounded roles, locations and annual INR salary", () => {
    expect(candidatePreferencesInputSchema.parse({
      preferredRoleTitles: ["Software Engineer"],
      preferredLocations: ["Hyderabad"],
      minimumAnnualCtcInr: 1500000,
    })).toMatchObject({minimumAnnualCtcInr: 1500000});
  });
  it("rejects forged selectors, excessive lists and salary", () => {
    const good = {preferredRoleTitles:["Engineer"]};
    for (const input of [
      {...good, collegeId:"not-authorized"},
      {preferredRoleTitles: Array.from({length:21}, (_,i)=>"Role "+i)},
      {preferredLocations: Array.from({length:21}, (_,i)=>"City "+i)},
      {minimumAnnualCtcInr:100000001},
      {minimumAnnualCtcInr:-1},
    ]) expect(candidatePreferencesInputSchema.safeParse(input).success).toBe(false);
  });
});
