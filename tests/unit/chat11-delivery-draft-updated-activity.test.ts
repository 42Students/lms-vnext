
import {expect,it} from "vitest";
import {projectDeliveryActivity} from "@/modules/projects/delivery-activity-model";
it("allows multiple saved draft edits without a falsely shared dedupe key",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const data=projectDeliveryActivity({action:"DRAFT_UPDATED",collegeId:id,organizationId:id,projectId:id,submissionId:id,version:2});
 expect(data.dedupeKey).toBeUndefined();
 expect(data.eventType).toBe("projects.delivery.draft_updated");
 expect(data.metadata).toEqual({projectId:id,version:2});
});
