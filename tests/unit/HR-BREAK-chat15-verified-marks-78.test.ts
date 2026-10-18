import {describe,expect,it} from "vitest";
import {uniqueHrVerifiedAcademicMarks}
 from "@/modules/placements/hr-verified-marks-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const row=(membershipId:string,level:string,percentage:number|null)=>({
 membershipId,level,percentage,
});
describe("HR-APPLICANTS-78: college-verified academic mark projection",()=>{
 it("projects distinct valid marks by membership and level without mixing learner data",()=>{
  const marks=uniqueHrVerifiedAcademicMarks([
   row(a,"UG",8900),row(a,"10TH",9500),row(b,"UG",6700),
  ]);
  expect(marks.get(a)).toEqual({UG:8900,"10TH":9500});
  expect(marks.get(b)).toEqual({UG:6700});
 });
 it("conflicting verified rows fail closed irrespective of query ordering",()=>{
  const original=[row(a,"UG",8900),row(a,"UG",9100),row(a,"UG",8900)];
  for(const rows of [original,[...original].reverse()]){
   const projected=uniqueHrVerifiedAcademicMarks(rows);
   expect(projected.get(a)?.UG).toBeUndefined();
  }
 });
 it("a verified duplicate of the same value is idempotent",()=>{
  expect(uniqueHrVerifiedAcademicMarks([row(a,"UG",8900),row(a,"UG",8900)]).get(a)?.UG)
   .toBe(8900);
 });
 it("corrupt or out-of-range historical marks cannot override a valid value",()=>{
  for(const value of [-1,10001,Number.NaN,Infinity,1.5]){
   const marks=uniqueHrVerifiedAcademicMarks([row(a,"UG",8900),row(a,"UG",value)]);
   expect(marks.get(a)?.UG).toBeUndefined();
  }
 });
 it("omits unverified level types, null marks and empty membership identifiers",()=>{
  expect(uniqueHrVerifiedAcademicMarks([
   row(a,"PHD",8000),row(a,"UG",null),row("","UG",8000),
  ]).size).toBe(0);
 });
 it("does not contaminate a second level or member when the first has a conflict",()=>{
  const marks=uniqueHrVerifiedAcademicMarks([
   row(a,"UG",8900),row(a,"UG",8100),row(a,"12TH",9500),
   row(b,"UG",7200),
  ]);
  expect(marks.get(a)).toEqual({"12TH":9500});
  expect(marks.get(b)).toEqual({UG:7200});
 });
});