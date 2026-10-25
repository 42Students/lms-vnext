import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
import {verificationEducationRows} from "@/modules/verification/education-rows";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-requests-verification-29 returns the latest 50 named audit events and full private review facts",()=>{
 const service=src("src/modules/verification/staff-review-detail-service.ts");
 const drawer=src("src/components/verification/VerificationReviewDrawer.tsx");
 expect(service).toContain("desc(profileVerificationEvents.createdAt)");
 expect(service).toContain(".limit(50)");
 expect(drawer).toContain("Showing the latest 50 history events.");
 expect(drawer).toContain('item.actorName??item.actorKind');
 expect(drawer).toContain('timeZone:"Asia/Kolkata"');
 expect(drawer).toContain('row.learnerName+(row.rollNumber?" · "+row.rollNumber:"")');
 expect(drawer).toContain("verificationEducationRows(detail.review.submittedSnapshot["education"])");
 expect(drawer).toContain('caption="Submitted education records"');
 expect(drawer).toContain('header:"Marksheet"');
 const projected=verificationEducationRows([{
  educationType:"Undergraduate",institutionName:"University",endYear:"2099",
  grade:"8.6",marksheetDocumentId:"recorded-receipt",
 },{educationType:"12th",institutionName:"School",endYear:"2094",grade:"92%"}]);
 expect(projected).toEqual([
  {id:"0",level:"Undergraduate",institution:"University",year:"2099",marks:"8.6",marksheet:"Submitted"},
  {id:"1",level:"12th",institution:"School",year:"2094",marks:"92%",marksheet:"Missing"},
 ]);
 expect(drawer).toContain("Numbers show only the last four digits; compare them with the document.");
 expect(drawer).toContain("private signed link");
 const hostile=verificationEducationRows([
  {educationType:"UG",institutionName:"  Example Institute  ",endYear:2099,
   grade:8.63,marksheetDocumentId:"  ",privateIdentityDocument:"do-not-copy"},
  {educationType:"PG",institutionName:"College",endYear:NaN,grade:Infinity,
   marksheetDocumentId:"actual-receipt"},
  null,["unexpected"],{educationType:"School",grade:0},
 ]);
 expect(hostile).toEqual([
  {id:"0",level:"UG",institution:"Example Institute",year:"2099",
   marks:"8.63",marksheet:"Missing"},
  {id:"1",level:"PG",institution:"College",year:"—",
   marks:"—",marksheet:"Submitted"},
  {id:"4",level:"School",institution:"—",year:"—",
   marks:"0",marksheet:"Missing"},
 ]);
 expect(JSON.stringify(hostile)).not.toContain("do-not-copy");
 expect(verificationEducationRows(Array.from({length:250},()=>({educationType:"School"})))).toHaveLength(100);
 expect(verificationEducationRows({educationType:"Unknown"})).toEqual([]);
});
