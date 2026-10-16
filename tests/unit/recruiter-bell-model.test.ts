import {describe,it,expect} from "vitest";
import {recruiterBellAriaLabel,recruiterBellPreview} from "@/modules/placements/recruiter-bell-model";
describe("REC-calendar-messages-profile-21 recruiter bell",()=>{
 it("uses exact unread accessible label",()=>{
  expect(recruiterBellAriaLabel(2)).toBe("Notifications, 2 new");
  expect(recruiterBellAriaLabel(0)).toBe("Notifications");
 });
 it("bounds the drawer without hiding full inbox",()=>{
  const rows=Array.from({length:30},(_,i)=>({id:String(i),title:"Drive",label:"Published",unread:true,
   jobId:"job",createdAt:"2026-10-17"}));
  expect(recruiterBellPreview(rows)).toHaveLength(6);
 });
});
