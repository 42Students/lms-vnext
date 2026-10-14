import { describe, it, expect } from "vitest";
import { collegeRecurringExecuteSchema, recurringExecutionSummary }
  from "@/modules/academics/college-recurring-execute-model";
const good={sectionId:"10000000-0000-4000-8000-000000000001",from:"2026-10-15",to:"2026-10-15",
  weekdays:[4],startTime:"09:00",endTime:"10:00",title:"Morning class",
  expectedSectionUpdatedAt:"2026-10-14T12:12:00.123Z",confirm:true};
describe("College recurring series execution",()=>{
  it("enforces confirmation and a source-authored optimistic token",()=>{
    expect(collegeRecurringExecuteSchema.parse(good).confirm).toBe(true);
    for(const changes of [{confirm:false},{expectedSectionUpdatedAt:"bad"},
      {title:""},{collegeId:"forged"}, {weekdays:[1,1]}])
      expect(collegeRecurringExecuteSchema.safeParse({...good,...changes}).success).toBe(false);
  });
  it("never describes a partially succeeded transaction as successful",()=>{
    expect(recurringExecutionSummary(2,2)).toEqual({created:2,requested:2,failed:0,allSucceeded:true});
    expect(recurringExecutionSummary(0,2)).toEqual({created:0,requested:2,failed:2,allSucceeded:false});
  });
});
