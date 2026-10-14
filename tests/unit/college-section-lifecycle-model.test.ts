import {describe,expect,it} from "vitest";
import {collegeSectionLifecycleSchema,classLifecyclePrompt}
  from "@/modules/academics/college-section-lifecycle-model";
describe("Class lifecycle confirmation",()=>{
  const data={action:"ARCHIVE",expectedUpdatedAt:"2026-10-14T12:00:00.123Z",confirm:true};
  it("rejects missing token, forged college and unconfirmed archival",()=>{
    expect(collegeSectionLifecycleSchema.parse(data)).toEqual(data);
    for(const patch of [{confirm:false},{expectedUpdatedAt:"invalid"},{collegeId:"forged"},
      {action:"DELETE"}])
      expect(collegeSectionLifecycleSchema.safeParse({...data,...patch}).success).toBe(false);
  });
  it("communicates preservation of dependent history",()=>{
    expect(classLifecyclePrompt("A","ARCHIVE")).toContain("history");
    expect(classLifecyclePrompt("A","RESTORE")).toContain("cohort");
  });
});
