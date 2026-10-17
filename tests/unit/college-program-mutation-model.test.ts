import { describe, expect, it } from "vitest";
import {
  archiveCollegeProgramSchema,
  canReduceProgramDuration,
  hasUnsavedCollegeProgramEdit,
  collegeProgramIdSchema,
  createCollegeProgramSchema,
  updateCollegeProgramSchema,
} from "@/modules/academics/college-program-mutation-model";

const departmentId = "11111111-1111-4111-8111-111111111111";
const input = { departmentId, name: "B.Tech Computer Science", code: "CSE", durationTerms: 8 };

describe("College Admin program write contracts", () => {
  it("does not mark equivalent year-to-terms edit as dirty",()=>{
    expect(hasUnsavedCollegeProgramEdit({name:"CSE",code:"CS",durationTerms:8},{name:"CSE",code:"CS",durationTerms:String(4*2)})).toBe(false);
  });
  it("requires a real department and validates exact program fields", () => {
    expect(createCollegeProgramSchema.parse({ ...input, name: "  Computer Science  " }).name)
      .toBe("Computer Science");
    expect(createCollegeProgramSchema.safeParse({ ...input, collegeId: departmentId }).success)
      .toBe(false);
    expect(createCollegeProgramSchema.safeParse({ ...input, durationTerms: 0 }).success)
      .toBe(false);
    expect(createCollegeProgramSchema.safeParse({ ...input, durationTerms: 25 }).success)
      .toBe(false);
    expect(createCollegeProgramSchema.safeParse({ ...input, code: "has space" }).success)
      .toBe(false);
    expect(createCollegeProgramSchema.safeParse({ ...input, name: " " }).success)
      .toBe(false);
  });

  it("requires strict complete edit fields and permits scoped department relocation", () => {
    expect(updateCollegeProgramSchema.parse({
      name: "Data Science", code: "DS", durationTerms: 6,
    })).toEqual({ name: "Data Science", code: "DS", durationTerms: 6 });
    expect(updateCollegeProgramSchema.safeParse({ name: "Renamed" }).success).toBe(false);
    expect(updateCollegeProgramSchema.parse({
      name: "Data Science", code: "DS", durationTerms: 6, departmentId,
    })).toEqual({ name: "Data Science", code: "DS", durationTerms: 6, departmentId });
    expect(updateCollegeProgramSchema.safeParse({
      name: "Data Science", code: "DS", durationTerms: 6, departmentId: "not-a-uuid",
    }).success).toBe(false);
    expect(updateCollegeProgramSchema.safeParse({
      name: "Data Science", code: "DS", durationTerms: 6, departmentId, collegeId: departmentId,
    }).success).toBe(false);
  });

  it("requires explicit archive confirmation and a UUID path", () => {
    expect(archiveCollegeProgramSchema.safeParse({}).success).toBe(false);
    expect(archiveCollegeProgramSchema.safeParse({ confirm: false }).success).toBe(false);
    expect(archiveCollegeProgramSchema.safeParse({ confirm: true }).success).toBe(true);
    expect(archiveCollegeProgramSchema.safeParse({ confirm: true, collegeId: departmentId }).success).toBe(false);
    expect(collegeProgramIdSchema.safeParse("nope").success).toBe(false);
  });

  it("confirms before discarding dirty inputs, even invalid drafts", () => {
    const saved = { name: "B.Tech CSE", code: "CSE", durationTerms: 8 };
    expect(hasUnsavedCollegeProgramEdit(saved, {
      name: "B.Tech CSE", code: "CSE", durationTerms: "8",
    })).toBe(false);
    expect(hasUnsavedCollegeProgramEdit(saved, {
      name: "B.Tech CSE", code: "CSE", durationTerms: "",
    })).toBe(true);
    expect(hasUnsavedCollegeProgramEdit(saved, {
      name: "B.Tech CSE", code: "CSE2", durationTerms: "8",
    })).toBe(true);
    expect(hasUnsavedCollegeProgramEdit(saved, {
      name: "B.Tech CSE ", code: "CSE", durationTerms: "8",
    })).toBe(true);
  });

  it("prohibits reducing duration below real referenced curriculum/progression", () => {
    expect(canReduceProgramDuration(4, 7)).toBe(false);
    expect(canReduceProgramDuration(7, 7)).toBe(true);
    expect(canReduceProgramDuration(8, 1)).toBe(true);
    expect(canReduceProgramDuration(0, 0)).toBe(false);
    expect(canReduceProgramDuration(25, 0)).toBe(false);
  });
});
