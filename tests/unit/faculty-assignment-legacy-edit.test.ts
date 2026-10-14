import { describe, expect, it } from "vitest";
import { facultyAssignmentLegacyEdit } from "@/modules/courses/faculty-assignment-authoring-model";
const current = {id:"10000000-0000-4000-8000-000000000001",title:"Draft",description:"Instructions",dueAt:new Date("2026-10-21T04:00:00Z"),maxPoints:10,sequence:2};
const token = {expectedUpdatedAt:"2026-10-14T09:00:00Z",confirmed:true};
describe("Faculty legacy assignment edit adapter", () => {
  it("preserves omitted fields while requiring the client version and confirmation", () => {
    expect(facultyAssignmentLegacyEdit(current,{title:"Updated",...token})).toMatchObject({
      action:"EDIT",assignmentId:current.id,title:"Updated",description:"Instructions",maxPoints:10,
      dueAt:"2026-10-21T04:00:00.000Z",...token,
    });
    expect(() => facultyAssignmentLegacyEdit(current,{title:"Bypass"})).toThrow();
    expect(() => facultyAssignmentLegacyEdit(current,{title:"Bypass",...token,confirmed:false})).toThrow();
  });
  it("allows explicit deadline clearing but rejects silent sequence changes and token-only writes", () => {
    expect(facultyAssignmentLegacyEdit(current,{dueAt:null,...token})).toMatchObject({dueAt:null});
    expect(() => facultyAssignmentLegacyEdit(current,{sequence:3,...token})).toThrow();
    expect(() => facultyAssignmentLegacyEdit(current,token)).toThrow();
  });
});
