import {describe,expect,it} from "vitest";
import {readRecruiterTodayLater,putRecruiterTodayLater,recruiterTodayTaskFingerprint} from "@/modules/placements/recruiter-today-later-model";
const task={key:"answer:job-1",tone:"SOON" as const,title:"Answer a question",description:"A question on the drive",href:"/recruiter/drives/job-1?tab=messages",at:null};
describe("Recruiter Today Later",()=>{
 it("defers only the unchanged exact task and restores changed details",()=>{
  const saved=putRecruiterTodayLater({},task);
  expect(readRecruiterTodayLater(JSON.stringify(saved),[task])).toEqual(saved);
  expect(readRecruiterTodayLater(JSON.stringify(saved),[{...task,description:"Updated question"}])).toEqual({});
 });
 it("does not retain unrelated college tasks or malformed browser values",()=>{
  const saved=putRecruiterTodayLater({"thread:other":"deadbeef"},task);
  expect(readRecruiterTodayLater(JSON.stringify(saved),[task])).toEqual({[task.key]:recruiterTodayTaskFingerprint(task)});
  for(const raw of ["[]","false","bad",JSON.stringify({[task.key]:123})]){
    expect(readRecruiterTodayLater(raw,[task])).toEqual({});
  }
 });
});
