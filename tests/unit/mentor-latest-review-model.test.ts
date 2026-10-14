import {describe,expect,it} from "vitest";
import {currentPendingMentorSubmissions} from "@/modules/projects/mentor-latest-review-model";
const t=new Date("2026-10-14T10:00:00.000Z");
const row=(projectId:string,version:number,status:string)=>({
  id:projectId+"-"+version,projectId,version,status,submittedAt:status==="DRAFT"?null:t,
});
describe("Mentor current final-delivery review alerts",()=>{
  it("does not signal an older submitted version after a newer review or draft",()=>{
    const pending=currentPendingMentorSubmissions([
      row("p",2,"APPROVED"),row("p",1,"SUBMITTED"),
      row("q",3,"DRAFT"),row("q",2,"SUBMITTED"),
      row("z",1,"SUBMITTED"),
    ]);
    expect([...pending.keys()]).toEqual(["z"]);
    expect(pending.get("z")?.version).toBe(1);
  });
  it("recognizes only latest submitted version independently of source sort",()=>{
    const pending=currentPendingMentorSubmissions([
      row("p",2,"CHANGES_REQUESTED"),row("p",3,"SUBMITTED"),
      row("p",1,"SUBMITTED"),
    ]);
    expect(pending.get("p")).toMatchObject({version:3,status:"SUBMITTED"});
    expect(currentPendingMentorSubmissions([]).size).toBe(0);
  });
});
