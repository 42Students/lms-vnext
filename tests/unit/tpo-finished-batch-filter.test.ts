import {describe,expect,it} from "vitest";
import {tpoStudentsQuerySchema} from "@/modules/placements/tpo-students-service";
import {tpoStudentFilterMessage,tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
describe("TPO-students-R01 explicit finished batch selection",()=>{
  it("only accepts a valid batch UUID, never an array",()=>{
    const batchId="11111111-1111-4111-8111-111111111111";
    expect(tpoStudentsQuerySchema.parse({collegeId:batchId,batchId}).batchId).toBe(batchId);
    expect(tpoStudentsQuerySchema.safeParse({collegeId:batchId,batchId:"wrong"}).success).toBe(false);
    expect(tpoStudentUrlError({batchId:[batchId,batchId]})).not.toBeNull();
    expect(tpoStudentFilterMessage({batchId:"wrong"})).toContain("selected batch is invalid");
  });
});
