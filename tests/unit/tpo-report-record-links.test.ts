import {describe,it,expect} from "vitest";
import {projectTpoReportRecordLinks,TPO_REPORT_LINK_LIMIT} from "@/modules/placements/tpo-report-record-links-model";
const a="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const b="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
describe("TPO report record links",()=>{
 it("builds safe links for both persisted report families",()=>{
  const jobs=[{id:a,label:"Engineer drive",companyName:"Acme"}],companies=[{id:b,label:"Acme",companyName:"Acme"}];
  expect(projectTpoReportRecordLinks(jobs,companies,"OFFERS").driveLinks[0]?.href).toBe("/tpo/placements/jobs/"+a+"/offers");
  expect(projectTpoReportRecordLinks(jobs,companies,"JOINING").driveLinks[0]?.href).toBe("/tpo/placements/jobs/"+a+"/joining");
  expect(projectTpoReportRecordLinks(jobs,companies,"JOINING").companyLinks[0]?.href).toBe("/tpo/companies/"+b);
 });
 it("ignores unsafe identifiers and caps navigation lists",()=>{
  const bad=[{id:"../hr",label:"Bad",companyName:"Bad"}];
  expect(projectTpoReportRecordLinks(bad,bad,"OFFERS").driveLinks).toEqual([]);
  const rows=Array.from({length:101},(_,i)=>({id:"aaaaaaaa-aaaa-4aaa-8aaa-"+String(i).padStart(12,"0"),label:String(i),companyName:"x"}));
  const projected=projectTpoReportRecordLinks(rows,[],"OFFERS");
  expect(projected.driveLinks).toHaveLength(TPO_REPORT_LINK_LIMIT);
  expect(projected.drivesTruncated).toBe(true);
 });
});
