import {describe,it,expect} from "vitest";
import {appendUniqueContactExportRows} from "@/modules/people/college-contacts-export-model";
import type {CollegeContactRow} from "@/modules/people/college-contacts-service";
describe("Contacts CSV membership de-duplication",()=>{
 const row=(id:string):CollegeContactRow=>({membershipId:id,name:id,email:"",phone:"",roles:["LEARNER"],status:"ACTIVE",joinedAt:new Date("2026-10-15T00:00:00Z")});
 it("keeps first occurrence and page order as memberships move between pages",()=>{
  const data:CollegeContactRow[]=[];
  appendUniqueContactExportRows(data,[row("1"),row("2")]);
  appendUniqueContactExportRows(data,[row("2"),row("3")]);
  expect(data.map(x=>x.membershipId)).toEqual(["1","2","3"]);
 });
});
