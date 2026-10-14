import { describe, expect, it } from "vitest";
import {
  canCreateSemesterTerm,
  createCollegeSemesterSchema,
  deleteCollegeSemesterSchema,
  semesterIdSchema,
  updateCollegeSemesterSchema,
} from "@/modules/academics/semester-mutation-model";

const programId = "10000000-0000-4000-8000-000000000001";

describe("College Admin semester mutation boundaries", () => {
  it("requires a real semester name, bounded credits and immutable create number", () => {
    expect(createCollegeSemesterSchema.parse({
      programId,
      termNumber: 2,
      name: "  Semester Two  ",
      totalCredits: null,
    })).toEqual({
      programId,
      termNumber: 2,
      name: "Semester Two",
      totalCredits: null,
    });
    for (const input of [
      { programId, termNumber: 1, name: " " },
      { programId, termNumber: 0, name: "I" },
      { programId, termNumber: 25, name: "I" },
      { programId, termNumber: 1, name: "I", collegeId: programId },
      { programId, termNumber: 1, name: "I", totalCredits: -1 },
      { programId, termNumber: 1, name: "I", totalCredits: 1.3 },
      { programId, termNumber: 1, name: "x".repeat(256) },
      { programId, termNumber: "2", name: "I" },
    ]) {
      expect(createCollegeSemesterSchema.safeParse(input).success).toBe(false);
    }
  });

  it("only allows mutable edit fields and nonempty names", () => {
    const version = "2026-10-14T12:12:00.123Z";
    expect(updateCollegeSemesterSchema.parse({
      name: " Final ", totalCredits: 20, isActive: false,
      expectedUpdatedAt:version,confirm:true,
    })).toEqual({ name: "Final", totalCredits: 20, isActive: false,
      expectedUpdatedAt:version,confirm:true });
    for (const input of [
      { name:"Good",totalCredits:null,isActive:true,expectedUpdatedAt:version,confirm:false },
      { name:"Good",totalCredits:null,isActive:true,expectedUpdatedAt:"bad",confirm:true },
      { name: " ", totalCredits: null, isActive: true },
      { name: "Good", totalCredits: -1, isActive: true },
      { name: "Good", totalCredits: null, isActive: true, programId },
      { name: "Good", totalCredits: null, isActive: true, termNumber: 2 },
      { name: "Good", totalCredits: null },
    ]) {
      expect(updateCollegeSemesterSchema.safeParse(input).success).toBe(false);
    }
  });

  it("requires an explicit delete confirmation and a UUID term", () => {
    expect(deleteCollegeSemesterSchema.safeParse({}).success).toBe(false);
    expect(deleteCollegeSemesterSchema.safeParse({ confirm: false }).success).toBe(false);
    expect(deleteCollegeSemesterSchema.safeParse({
      confirm: true, collegeId: programId,
    }).success).toBe(false);
    expect(deleteCollegeSemesterSchema.parse({ confirm: true })).toEqual({ confirm: true });
    expect(semesterIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("checks semester number against program duration", () => {
    expect(canCreateSemesterTerm(4, 4)).toBe(true);
    expect(canCreateSemesterTerm(5, 4)).toBe(false);
    expect(canCreateSemesterTerm(0, 8)).toBe(false);
    expect(canCreateSemesterTerm(1.5, 8)).toBe(false);
  });
});
