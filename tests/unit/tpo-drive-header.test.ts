import {describe,expect,it} from "vitest";
import {projectTpoDriveHeader} from "@/modules/placements/tpo-drive-header-model";
const drive={status:"DRAFT",applicationMode:"INTERNAL",workMode:"ONSITE",employmentType:"FULL_TIME",
 minimumAnnualCtcInr:500000,maximumAnnualCtcInr:850000,applicationDeadline:"2026-10-16T04:30:00.000Z"};
describe("TPO-drive-workspace-03 header facts",()=>{
 it("projects draft, work mode, application mode, pay range and IST deadline",()=>{
  expect(projectTpoDriveHeader(drive)).toMatchObject({
   status:"Draft",applicationMode:"Apply here",workMode:"onsite",employmentType:"full time",
   ctc:"₹5 LPA – ₹8.5 LPA",
  });
  expect(projectTpoDriveHeader(drive).deadline).toContain("10:00");
 });
 it("distinguishes request, published, closed, cancelled and declined",()=>{
  for(const [status,label] of [["REQUEST","Needs your review"],["PUBLISHED","Open"],
   ["CLOSED","Closed"],["CANCELLED","Cancelled"],["REJECTED","Declined"]] as const)
    expect(projectTpoDriveHeader({...drive,status},new Date("2026-10-15T00:00:00Z")).status).toBe(label);
  expect(projectTpoDriveHeader({...drive,status:"PUBLISHED"},
   new Date("2026-10-22T00:00:00Z")).status).toBe("Open · Expired");
 });
 it("does not label ordinary external application as recorded outside",()=>{
  expect(projectTpoDriveHeader({...drive,applicationMode:"EXTERNAL_ONLY"}).recordedOutside).toBe(false);
  expect(projectTpoDriveHeader({...drive,recordedOutside:true}).recordedOutside).toBe(true);
 });
 it("handles missing pay and deadlines without inventing numbers",()=>{
  expect(projectTpoDriveHeader({...drive,minimumAnnualCtcInr:null,maximumAnnualCtcInr:null,applicationDeadline:null}))
   .toMatchObject({ctc:"CTC not yet announced",deadline:"Deadline not set"});
 });
});
