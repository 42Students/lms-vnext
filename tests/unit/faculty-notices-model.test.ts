import { describe, expect, it } from "vitest";
import { facultyNoticeParamsSchema, FACULTY_SECTION_NOTICES_BLOCKER } from "@/modules/courses/faculty-notices-model";

describe("Faculty Section notice availability",()=>{
  const deliveryId="00000000-0000-4000-8000-000000000001";
  it("accepts exactly one UUID delivery selector",()=>{
    expect(facultyNoticeParamsSchema.parse({deliveryId})).toEqual({deliveryId});
    expect(facultyNoticeParamsSchema.safeParse({deliveryId,collegeId:deliveryId}).success).toBe(false);
    expect(facultyNoticeParamsSchema.safeParse({deliveryId:"outside"}).success).toBe(false);
  });
  it("reports unregistered announcement storage honestly",()=>{
    expect(FACULTY_SECTION_NOTICES_BLOCKER).toContain("not yet promoted");
    expect(FACULTY_SECTION_NOTICES_BLOCKER).toContain("Discussions");
  });
});
