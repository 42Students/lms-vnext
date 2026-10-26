import {describe,expect,it} from "vitest";
import {recruiterTodayWaitingRequests} from "@/modules/placements/recruiter-today-waiting-model";
import {recruiterDriveProgressSteps,recruiterDriveNextAction,
 type RecruiterDriveProgressInput} from "@/modules/placements/recruiter-drive-progress-model";

const base:RecruiterDriveProgressInput={
 shared:0,active:0,withdrawn:0,issuedOffers:0,acceptedOffers:0,
 totalRounds:0,completedRounds:0,readOnly:false,
};
const request=(id:number,status:string,draft:unknown=undefined)=>({
 id:"request-"+id,status,draft,createdAt:new Date(Date.UTC(2099,0,id+1)),
});
describe("HR-BREAK-TODAY-WAITING-39 persisted recruiter requests only",()=>{
 it("includes only formal submitted and sent-back placement-cell requests",()=>{
  const result=recruiterTodayWaitingRequests([
   request(1,"DRAFT"),request(2,"REQUEST"),request(3,"SENT_BACK"),
   request(4,"CANCELLED"),request(5,"REJECTED"),request(6,"PUBLISHED"),
  ]);
  expect(result.map(item=>item.id)).toEqual(["request-3","request-2"]);
  expect(result.map(item=>item.status)).toEqual(["SENT_BACK","REQUEST"]);
 });
 it("sorts newest first, caps dashboard to eight, and does not mutate source",()=>{
  const input=Array.from({length:14},(_,i)=>request(i,"REQUEST"));
  const copy=[...input];
  const result=recruiterTodayWaitingRequests(input);
  expect(result).toHaveLength(8);
  expect(result[0]?.id).toBe("request-13");
  expect(result[7]?.id).toBe("request-6");
  expect(input).toEqual(copy);
 });
 it.each([null,undefined,"title",17,{title:null},{title:[]},{title:42}])(
  "does not surface an unvalidated draft title from %j",draft=>{
   expect(recruiterTodayWaitingRequests([request(1,"REQUEST",draft)])[0]?.title)
    .toBe("Hiring request");
  },
 );
 it("retains the exact user-facing title only for a validated string",()=>{
  expect(recruiterTodayWaitingRequests([request(1,"SENT_BACK",{title:"Hiring graduate trainee"})])[0]?.title)
   .toBe("Hiring graduate trainee");
 });
});
describe("HR-BREAK-TODAY-PROGRESS-39 employer-visible next steps and no false completion",()=>{
 it("starts in Applications without claiming offers or joining completed",()=>{
  const steps=recruiterDriveProgressSteps(base);
  expect(steps.map(item=>item.label)).toEqual([
   "Requested","Approved","Applications","Rounds","Offers","Completed",
  ]);
  expect(steps.map(item=>item.state)).toEqual([
   "COMPLETE","COMPLETE","CURRENT","UPCOMING","UPCOMING","UPCOMING",
  ]);
 });
 it("shows Rounds current only after authorized shared applicants and rounds exist",()=>{
  expect(recruiterDriveProgressSteps({...base,totalRounds:2,shared:0})[2]?.state)
   .toBe("CURRENT");
  expect(recruiterDriveProgressSteps({...base,totalRounds:2,shared:5})[3]?.state)
   .toBe("CURRENT");
 });
 it("does not claim that issuing or accepting offers closes the drive",()=>{
  const issued=recruiterDriveProgressSteps({...base,issuedOffers:1});
  expect(issued[4]?.state).toBe("CURRENT");
  expect(issued[5]?.state).toBe("UPCOMING");
  const accepted=recruiterDriveProgressSteps({...base,issuedOffers:2,acceptedOffers:1});
  expect(accepted[4]?.state).toBe("CURRENT");
  expect(accepted[5]?.state).toBe("UPCOMING");
  const closed=recruiterDriveProgressSteps({...base,closed:true,readOnly:true});
  expect(closed[5]?.state).toBe("CURRENT");
 });
 it.each([
  [{...base,readOnly:true},"Hire again",null],
  [{...base,issuedOffers:1},"View offers","offers"],
  [{...base,shared:0,totalRounds:2},"Review applicants","applicants"],
  [{...base,shared:2,totalRounds:2},"Rounds & results","rounds"],
  [{...base,shared:2},"Review applicants","applicants"],
 ] as const)("suggests only employer-authorized next action for stage %j", (input,label,tab)=>{
  expect(recruiterDriveNextAction(input)).toMatchObject({label,tab});
 });
});
