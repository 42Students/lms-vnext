
import {expect,it} from "vitest";
import {projectDeliveryActivity} from "@/modules/projects/delivery-activity-model";
it("creates a draft audit event without copying learner-authored content",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const data=projectDeliveryActivity({action:"DRAFT_CREATED",collegeId:id,organizationId:id,projectId:id,submissionId:id,version:1});
 expect(data.eventType).toBe("projects.delivery.draft_created");
 expect(data.subjectType).toBe("project_submission");
 expect(data.groupKey).toBe("project:"+id+":deliveries");
 expect(data.dedupeKey).toContain(":DRAFT_CREATED");
});
