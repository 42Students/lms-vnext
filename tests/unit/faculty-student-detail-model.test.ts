import { describe, expect, it } from "vitest";
import {
  facultyStudentDetailParamsSchema, findAuthorizedFacultyStudent,
  summarizeFacultyStudentAttendance,
} from "@/modules/courses/faculty-student-detail-model";

const id = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
describe("Faculty learner drill-in model", () => {
  it("only returns exact active roster members", () => {
    const roster = [{membershipId:id,displayName:"Learner A"}];
    expect(findAuthorizedFacultyStudent(roster,id)).toEqual(roster[0]);
    expect(findAuthorizedFacultyStudent(roster,other)).toBeNull();
  });
  it("does not count missing and future marks as Present", () => {
    expect(summarizeFacultyStudentAttendance({
      present:3,absent:1,unmarked:5,upcoming:2,attendedPercent:75,
    })).toEqual({
      present:3,absent:1,unmarked:5,upcoming:2,recorded:4,percent:75,
    });
    expect(summarizeFacultyStudentAttendance({
      present:0,absent:0,unmarked:5,upcoming:2,attendedPercent:null,
    }).percent).toBeNull();
  });
  it("rejects forged identifiers and extra caller scope", () => {
    expect(facultyStudentDetailParamsSchema.safeParse({deliveryId:id,membershipId:other}).success).toBe(true);
    expect(facultyStudentDetailParamsSchema.safeParse({deliveryId:id,membershipId:other,collegeId:id}).success).toBe(false);
    expect(facultyStudentDetailParamsSchema.safeParse({deliveryId:"bad",membershipId:other}).success).toBe(false);
  });
});
