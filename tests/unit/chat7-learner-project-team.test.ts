import { describe, expect, it } from "vitest";
import { summarizeLearnerProjectTeams } from "@/modules/projects/learner-project-team-model";

describe("L20-012 scoped learner project team cards", () => {
  it("prefers primary mentor, counts distinct live memberships and does not expose other project rows", () => {
    const output = summarizeLearnerProjectTeams(["mine", "empty"], [
      {projectId:"mine", membershipId:"l1", role:"LEARNER", isPrimary:false, displayName:"A"},
      {projectId:"mine", membershipId:"m1", role:"MENTOR", isPrimary:false, displayName:"Secondary"},
      {projectId:"mine", membershipId:"m2", role:"MENTOR", isPrimary:true, displayName:"Primary"},
      {projectId:"other", membershipId:"f1", role:"MENTOR", isPrimary:true, displayName:"Private"},
    ]);
    expect(output).toEqual([
      {projectId:"mine", memberCount:3, mentorName:"Primary"},
      {projectId:"empty", memberCount:0, mentorName:null},
    ]);
  });
  it("uses a non-primary mentor only when no primary is assigned", () => {
    expect(summarizeLearnerProjectTeams(["p"], [
      {projectId:"p",membershipId:"m",role:"MENTOR",isPrimary:false,displayName:"Co-mentor"},
    ])[0]?.mentorName).toBe("Co-mentor");
  });
});
