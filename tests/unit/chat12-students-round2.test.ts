import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {tpoStudentUrlError,tpoStudentFilterMessage} from "@/modules/placements/tpo-students-url-guard";
const source=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-12 round-2 students compatibility and layout",()=>{
 it("TPO-students-25 accepts a legacy q deep link without bypassing strict filter validation",()=>{
   expect(tpoStudentUrlError({q:"Ada"})).toBeNull();
   expect(tpoStudentUrlError({q:"Ada",search:"Bob"})).toContain("one Students search field");
   expect(tpoStudentUrlError({q:["Ada","Bob"]})).toContain("Repeated");
   expect(tpoStudentFilterMessage({q:"x".repeat(151)})).toContain("too long");
   expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("first(raw.search) || first(raw.q)");
 });
 it("TPO-students-R04 only has one journey and branch selector",()=>{
   const sheet=source("src/components/tpo/tpo-students-spreadsheet.tsx");
   const page=source("src/app/(authenticated)/tpo/students/page.tsx");
   expect(sheet).not.toContain('key:"journeyState"');
   expect(sheet).not.toContain('key:"branchId"');
   expect(page).toContain('name="journeyState"');
   expect(page).toContain('name="branchId"');
 });
 it("TPO-students-43 surfaces needs-attention context and authorized team/eligibility links",()=>{
   const panel=source("src/components/tpo/tpo-student-quick-panel.tsx");
   expect(panel).toContain('student.verification.status==="WAITING"');
   expect(panel).toContain('student.offersAwaitingAnswer>0');
   expect(panel).toContain('student.participationStatus==="INELIGIBLE"');
   expect(panel).toContain('encodeURIComponent("STUDENT:"+student.membershipId)');
   expect(panel).toContain("Placement eligibility");
 });
 it("TPO-students-54 displays after-college outcome pill with placement-evidence distinction",()=>{
   const sheet=source("src/components/tpo/tpo-students-spreadsheet.tsx");
   const pill=source("src/components/tpo/tpo-student-outcome-pill.tsx");
   expect(sheet).toContain("<TpoStudentOutcomePill");
   expect(pill).toContain("AFTER_COLLEGE_LABELS[recorded]");
   expect(pill).toContain("title={placed?");
 });
});
