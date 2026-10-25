import {describe,it,expect} from "vitest";
import {recruiterInviteNotHiringNoteSchema,recruiterInviteNotHiringReason}
 from "@/modules/placements/recruiter-invite-not-hiring-note-model";
describe("Public recruiter not-hiring note",()=>{
 it("allows optional short notes, trims and validates length",()=>{
  expect(recruiterInviteNotHiringNoteSchema.parse("  Try again in March  ")).toBe("Try again in March");
  expect(recruiterInviteNotHiringNoteSchema.safeParse("X".repeat(201)).success).toBe(false);
  expect(recruiterInviteNotHiringNoteSchema.safeParse("unsafe\u0000text").success).toBe(false);
 });
 it("persists a bounded reason without changing the opt-out option",()=>{
  expect(recruiterInviteNotHiringReason("  Internship hiring paused.  "))
    .toBe("Not hiring this season: Internship hiring paused.");
  expect(recruiterInviteNotHiringReason(undefined))
    .toContain("not hiring from this college");
 });
});
