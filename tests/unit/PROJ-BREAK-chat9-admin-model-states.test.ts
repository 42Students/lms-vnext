import {describe,expect,it} from "vitest";
import {canAdminSettleDelivery,adminDeliveryToast} from "@/modules/projects/admin-submission-review-model";
import {restoreProjectInstanceInputSchema,restoredProjectStatus} from "@/modules/projects/instance-restore-model";
import {latestProjectSubmission,deriveProjectRiskReasons} from "@/modules/projects/risk-signals";

describe("IIT Dharwad Projects admin state boundaries",()=>{
 it("PROJ-BREAK-admin-state-18 delivery actions fail closed for every non-active or locked project",()=>{
  for(const status of ["PLANNED","COMPLETED","ARCHIVED","UNKNOWN"]){
   for(const action of ["APPROVED","CHANGES_REQUESTED","LOCK"] as const){
    expect(canAdminSettleDelivery("SUBMITTED",false,status,action)).toBe(false);
   }
  }
  for(const action of ["APPROVED","CHANGES_REQUESTED","LOCK"] as const){
   expect(canAdminSettleDelivery("SUBMITTED",true,"ACTIVE",action)).toBe(false);
  }
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","APPROVED")).toBe(true);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","CHANGES_REQUESTED")).toBe(true);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","LOCK")).toBe(true);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","LOCK")).toBe(true);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","APPROVED")).toBe(false);
  expect(canAdminSettleDelivery("CHANGES_REQUESTED",false,"ACTIVE","LOCK")).toBe(false);
  expect(adminDeliveryToast("APPROVED")).toBe("Submission accepted.");
  expect(adminDeliveryToast("CHANGES_REQUESTED")).toBe("Changes requested.");
  expect(adminDeliveryToast("LOCK")).toBe("Submission locked.");
 });
 it("PROJ-BREAK-admin-state-19 archive restoration admits only an ISO timestamp and known prior states",()=>{
  expect(restoreProjectInstanceInputSchema.safeParse({expectedUpdatedAt:"2099-01-01T01:02:03+05:30"}).success).toBe(true);
  for(const input of [{},{expectedUpdatedAt:"yesterday"},{expectedUpdatedAt:1},
    {expectedUpdatedAt:"2099-01-01T01:02:03+05:30",status:"ACTIVE"}]){
   expect(restoreProjectInstanceInputSchema.safeParse(input).success).toBe(false);
  }
  expect(restoredProjectStatus("ACTIVE")).toBe("ACTIVE");
  expect(restoredProjectStatus("COMPLETED")).toBe("COMPLETED");
  for(const historical of ["ARCHIVED","DELETED","draft",null,undefined,{}]){
   expect(restoredProjectStatus(historical)).toBe("PLANNED");
  }
 });
 it("PROJ-BREAK-admin-state-20 latest submission is by version, never by row order",()=>{
  expect(latestProjectSubmission([])).toBeNull();
  const versions=[{id:"v3",version:3,status:"APPROVED"},
    {id:"v1",version:1,status:"SUBMITTED"},
    {id:"v4",version:4,status:"CHANGES_REQUESTED"},
    {id:"v2",version:2,status:"SUBMITTED"}];
  expect(latestProjectSubmission(versions)?.id).toBe("v4");
  expect(latestProjectSubmission([...versions].reverse())?.id).toBe("v4");
 });
 it("PROJ-BREAK-admin-state-21 archived and completed workspaces never remain at risk and historical approvals are not pending",()=>{
  const active={projectStatus:"ACTIVE",inactiveDays:8,latestSubmissionStatus:"SUBMITTED",hasBlockedTask:true};
  expect(deriveProjectRiskReasons(active)).toEqual(["No activity in 8 days","Active blocker","Pending review"]);
  for(const status of ["ARCHIVED","COMPLETED"]){
   expect(deriveProjectRiskReasons({...active,projectStatus:status})).toEqual([]);
  }
  expect(deriveProjectRiskReasons({...active,inactiveDays:0,latestSubmissionStatus:"APPROVED",
   hasBlockedTask:false})).toEqual([]);
 });
});
