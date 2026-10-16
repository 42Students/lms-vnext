import {describe,it,expect} from "vitest";
import {filterEngageRoster} from "@/modules/placements/tpo-engage-filter-model";
const lead={stage:"JOINED" as const,name:"Recruiter",companyName:"Acme",emailNorm:"talent@acme.com",
 phoneNorm:null,ownerName:"Asha",inviteStatus:"JOINED",source:"REFERRAL",
 recruiterUserId:"user-1",unsubscribedAt:null};
const defaults={stage:"ALL",query:"",owner:"ALL",invite:"ALL",status:"ALL",source:"ALL"};
describe("TPO-recruiters-03 Engage filters",()=>{
 it("filters joined, invite, owner and query without leaking rows",()=>{
  expect(filterEngageRoster([lead],{...defaults,status:"JOINED",owner:"Asha",invite:"JOINED",query:"acme"})).toHaveLength(1);
  expect(filterEngageRoster([lead],{...defaults,status:"NOT_JOINED"})).toHaveLength(0);
  expect(filterEngageRoster([lead],{...defaults,source:"EVENT"})).toHaveLength(0);
 });
});
