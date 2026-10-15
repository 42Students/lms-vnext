
import {expect,it} from "vitest";
import {projectDeliveryActivity} from "@/modules/projects/delivery-activity-model";
it("records approval and revision decisions without exposing private review feedback",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 for(const decision of ["APPROVED","CHANGES_REQUESTED"] as const){
  const event=projectDeliveryActivity({action:"REVIEWED",collegeId:id,organizationId:id,
    projectId:id,submissionId:id,version:4,decision});
  expect(event.eventType).toBe("projects.delivery.reviewed");
  expect(event.metadata).toEqual({projectId:id,version:4,decision});
  expect(JSON.stringify(event)).not.toMatch(/feedback|sourceUrl|demoUrl|notes/i);
 }
});
