
import {expect,it} from "vitest";
import {projectDeliveryActivity} from "@/modules/projects/delivery-activity-model";
const id="11111111-1111-4111-8111-111111111111";
it("registers delivery lifecycle audit events with only non-sensitive metadata",()=>{
 for(const action of ["DRAFT_CREATED","DRAFT_UPDATED","SUBMITTED","REVIEWED"] as const){
  const item=projectDeliveryActivity({action,collegeId:id,organizationId:id,projectId:id,submissionId:id,version:3,decision:"APPROVED"});
  expect(item.eventType).toBe("projects.delivery."+action.toLowerCase());
  expect(item.metadata).toEqual({projectId:id,version:3,...(action==="REVIEWED"?{decision:"APPROVED"}:{})});
  expect(JSON.stringify(item)).not.toMatch(/sourceUrl|demoUrl|feedback|membershipId|notes/i);
 }
});
