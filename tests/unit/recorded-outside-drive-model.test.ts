import {expect,it} from "vitest";
import {recordedOutsideDriveSchema,outsideDriveIsPlatformJob} from "@/modules/placements/recorded-outside-model";
it("records only an already occurred external drive, never a learner-visible platform job",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const row={collegeId:id,companyRelationshipId:id,title:"External campus drive",
  occurredAt:"2026-10-01T10:00:00+05:30",externalReferenceUrl:"https://example.com/drive"};
 expect(recordedOutsideDriveSchema.safeParse(row).success).toBe(true);
 expect(recordedOutsideDriveSchema.safeParse({...row,occurredAt:"2050-10-01T10:00:00+05:30"}).success).toBe(false);
 expect(recordedOutsideDriveSchema.safeParse({...row,learnerId:id}).success).toBe(false);
 expect(outsideDriveIsPlatformJob()).toBe(false);
});
