
import {expect,it} from "vitest";
import {projectDeliveryActivity} from "@/modules/projects/delivery-activity-model";
it("registers a stable per-version delivery submission audit identity",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const item=projectDeliveryActivity({action:"SUBMITTED",collegeId:id,organizationId:id,projectId:id,submissionId:id,version:4});
 expect(item.eventType).toBe("projects.delivery.submitted");
 expect(item.dedupeKey).toBe("project-delivery:"+id+":SUBMITTED");
 expect(item.summary).toBe("Project delivery submitted for review");
});
