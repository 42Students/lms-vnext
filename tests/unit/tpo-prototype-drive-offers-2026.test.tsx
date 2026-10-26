import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {TpoDriveOffersPrototypeReview} from "@/components/tpo/tpo-drive-offers-prototype-review";

const job="11111111-1111-4111-8111-111111111111";
const rows=[{
 id:"22222222-2222-4222-8222-222222222222",name:"Verified learner",
 membershipId:"33333333-3333-4333-8333-333333333333",rollNumber:"CSE-23",branch:"CSE",
 role:"Systems Engineer",status:"ISSUED",statusLabel:"Issued",kind:"OFFER",
 issued:"2026-10-25T08:30:00Z",responded:null,expires:"2026-10-28T08:30:00Z",
 joining:null,ruleCheck:"Awaiting learner response",respondByHours:72,annualCtcInr:700000,
}];
const queue=[
 {id:"s1",name:"Needs review student",roleTitle:"Developer",status:"SELECTED",offerReady:false},
 {id:"s2",name:"Preliminary student",roleTitle:"Developer",status:"VERIFIED",offerReady:true},
];
describe("TPO original Drive Offers prototype",()=>{
 it("separates issuer-confirmed offer records from unissued selections and policy preliminaries",()=>{
  const html=renderToStaticMarkup(createElement(TpoDriveOffersPrototypeReview,{
   jobId:job,rows,total:3,selectedQueue:queue,queueAvailable:true,
  }));
  expect(html).toContain("Step 1 of 2");
  expect(html).toContain("2 recorded selections await review or release");
  expect(html).toContain("1 preliminarily eligible");
  expect(html).toContain("1 need evidence review");
  expect(html).toContain("Needs review student");
  expect(html).toContain("Review and confirm release");
  expect(html).toContain("Final held-offer and college-rule checks occur again");
  expect(html).toContain("Verified learner");
  expect(html).toContain("Response deadline");
  expect(html).toContain("Full offer evidence and history");
  expect(html).not.toContain("29 clear to release");
  expect(html).not.toContain("Release 29 offers");
  expect(html).not.toContain("Harika Devi");
 });
 it("never reports zero unissued selections on read failure",()=>{
  const html=renderToStaticMarkup(createElement(TpoDriveOffersPrototypeReview,{
   jobId:job,rows,total:3,selectedQueue:[],queueAvailable:false,
  }));
  expect(html).toContain("Selection queue unavailable");
  expect(html).toContain("Selection readiness could not be verified");
  expect(html).not.toContain("0 recorded selections await");
 });
 it("uses college-scoped real source and existing authenticated confirm-to-release",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx","utf8");
  const service=readFileSync("src/modules/placements/tpo-drive-selection-service.ts","utf8");
  const manager=readFileSync("src/components/placements/tpo-drive-selection-manager.tsx","utf8");
  expect(page).toContain("getTpoDriveOfferRegister(context,parsed.data)");
  expect(page).toContain("getTpoSelectionWorkspace(context,p.jobId)");
  expect(page).toContain("if(e instanceof AuthorizationError)throw e");
  expect(page).toContain("<TpoDriveOffersPrototypeReview");
  expect(service).toContain("requireTpoJobCollege(context)");
  expect(service).toContain("requireTpoJobActor(tx, context)");
  expect(manager).toContain("expectedRecordedAt");
  expect(manager).toContain("VERIFIED");
  expect(manager).toContain("ConfirmDialog");
  expect(manager).toContain("Releasing issues offers immediately");
 });
});
